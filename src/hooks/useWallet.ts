"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK, SUPPORTED_ASSETS } from "@/lib/flare";
import { getStableCoinContract, getERC20Contract, DEPLOYED_ADDRESSES } from "@/lib/contracts";
import { formatTokenFromWei } from "@/lib/atm";

type InjectedProvider = ethers.Eip1193Provider & {
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

async function getInjectedProvider(): Promise<InjectedProvider | null> {
  const announced = await new Promise<InjectedProvider | null>((resolve) => {
    let settled = false;
    const handler = (event: Event) => {
      const provider = (event as CustomEvent<{ provider?: InjectedProvider }>).detail?.provider;
      if (!settled && provider?.request) {
        settled = true;
        window.removeEventListener("eip6963:announceProvider", handler);
        resolve(provider);
      }
    };
    window.addEventListener("eip6963:announceProvider", handler);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(() => {
      if (!settled) {
        settled = true;
        window.removeEventListener("eip6963:announceProvider", handler);
        resolve(null);
      }
    }, 150);
  });

  if (announced) return announced;

  try {
    const provider = window.ethereum as InjectedProvider | undefined;
    return provider?.request ? provider : null;
  } catch {
    return null;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  // Native FLR balance (in FLR, not wei).
  const [nativeBalance, setNativeBalance] = useState<number>(0);
  // Per-asset ERC-20 balances keyed by symbol (e.g. { FLRD: 1000, FXRP: 50 }).
  const [assetBalances, setAssetBalances] = useState<Record<string, number>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const injectedProvider = await getInjectedProvider();
    if (!injectedProvider) {
      setError("No compatible wallet found. Disable duplicate wallet extensions or install an EIP-6963 wallet.");
      return;
    }
    try {
      const browserProvider = new ethers.BrowserProvider(injectedProvider);
      await browserProvider.send("eth_requestAccounts", []);

      const network = FLARE_NETWORKS[DEFAULT_NETWORK];
      try {
        await browserProvider.send("wallet_switchEthereumChain", [
          { chainId: network.chainIdHex },
        ]);
      } catch {
        await browserProvider.send("wallet_addEthereumChain", [
          {
            chainId: network.chainIdHex,
            chainName: network.name,
            nativeCurrency: { name: network.currency, symbol: network.currency, decimals: 18 },
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.explorerUrl],
          },
        ]);
      }

      const s = await browserProvider.getSigner();
      const addr = await s.getAddress();
      setAddress(addr);
      setSigner(s);
      setProvider(browserProvider);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!signer || !address) return;
    // Native FLR balance.
    try {
      const raw = await signer.provider.getBalance(address);
      setNativeBalance(Number(ethers.formatEther(raw)));
    } catch {
      setNativeBalance(0);
    }
    // FLRD via the StableCoin contract (kept for backwards-compat with the
    // legacy `balance` field used by the top status bar and old panels).
    if (!DEPLOYED_ADDRESSES.stableCoin) {
      setBalance(0);
    } else {
      try {
        const contract = getStableCoinContract(signer, DEPLOYED_ADDRESSES.stableCoin);
        const rawBalance = await contract.balanceOf(address);
        setBalance(formatTokenFromWei(rawBalance));
      } catch {
        setBalance(0);
      }
    }
    // All supported ERC-20 assets.
    const next: Record<string, number> = {};
    for (const asset of SUPPORTED_ASSETS) {
      if (!asset.address) {
        next[asset.symbol] = 0;
        continue;
      }
      try {
        const token = getERC20Contract(signer, asset.address);
        const raw = await token.balanceOf(address);
        next[asset.symbol] = Number(ethers.formatUnits(raw, asset.decimals));
      } catch {
        next[asset.symbol] = 0;
      }
    }
    setAssetBalances(next);
  }, [signer, address]);

  const [faucetPending, setFaucetPending] = useState(false);

  const claimFaucet = useCallback(async () => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }
    if (!DEPLOYED_ADDRESSES.stableCoin) {
      setError("StableCoin not deployed. Run `npm run deploy` first.");
      return;
    }
    try {
      setFaucetPending(true);
      setError(null);
      const contract = getStableCoinContract(signer, DEPLOYED_ADDRESSES.stableCoin);
      const tx = await contract.faucet();
      await tx.wait();
      await refreshBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Faucet claim failed");
    } finally {
      setFaucetPending(false);
    }
  }, [signer, refreshBalance]);

  useEffect(() => {
    if (address) refreshBalance();
  }, [address, refreshBalance]);

  return {
    address,
    balance,
    nativeBalance,
    assetBalances,
    isConnected,
    provider,
    signer,
    error,
    faucetPending,
    connect,
    refreshBalance,
    claimFaucet,
  };
}
