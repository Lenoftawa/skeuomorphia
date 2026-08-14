"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { DEPLOYED_ADDRESSES, ERC20_ABI } from "@/lib/contracts";
import type { PriceFeed } from "@/lib/types";

export interface FAssetInfo {
  symbol: string;
  underlying: string;
  chain: string;
  decimals: number;
  price: number;
  mintFeeBips: number;
  totalSupply: number;
  assetManagerAddress: string;
  tokenAddress: string;
  userBalance: number;
  minimumRedeemAmount: number;
  directMintingPaymentAddress: string;
}

const FASSET_REGISTRY = [
  {
    symbol: "FXRP",
    underlying: "XRP",
    chain: "XRPL",
    decimals: 6,
    tokenAddress: DEPLOYED_ADDRESSES.fxrp || "0x0b6A3645c240605887a5532109323A3E12273dc7",
  },
];

const FASSET_ABI = ERC20_ABI.concat([
  "function totalSupply() view returns (uint256)",
  "function assetManager() view returns (address)",
]);

const ASSET_MANAGER_INFO_ABI = [
  "function fAsset() view returns (address)",
  "function getDirectMintingFeeBIPS() view returns (uint256)",
  "function minimumRedeemAmountUBA() view returns (uint256)",
  "function directMintingPaymentAddress() view returns (string)",
];

const ASSET_MANAGER_REDEEM_ABI = [
  "function redeemAmount(uint256 amountUBA, string redeemerUnderlyingAddress, address payable executor) payable returns (uint256 redeemedAmountUBA)",
];

export function useFAssets(prices: PriceFeed[], address: string | null) {
  const [fassets, setFassets] = useState<FAssetInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const priceMap: Record<string, number> = {};
    for (const price of prices) priceMap[price.symbol] = price.price;

    const assets: FAssetInfo[] = [];
    for (const config of FASSET_REGISTRY) {
      try {
        if (await provider.getCode(config.tokenAddress) === "0x") continue;
        const token = new ethers.Contract(config.tokenAddress, FASSET_ABI, provider);
        const [assetManagerAddress, totalSupply, userBalance] = await Promise.all([
          token.assetManager(),
          token.totalSupply(),
          address ? token.balanceOf(address) : Promise.resolve(0n),
        ]);
        const assetManager = new ethers.Contract(assetManagerAddress, ASSET_MANAGER_INFO_ABI, provider);
        const [managedToken, mintFeeBips, minimumRedeemAmount, directMintingPaymentAddress] = await Promise.all([
          assetManager.fAsset(),
          assetManager.getDirectMintingFeeBIPS(),
          assetManager.minimumRedeemAmountUBA(),
          assetManager.directMintingPaymentAddress(),
        ]);
        if (managedToken.toLowerCase() !== config.tokenAddress.toLowerCase()) continue;

        assets.push({
          ...config,
          price: priceMap[config.underlying] || 0,
          mintFeeBips: Number(mintFeeBips),
          totalSupply: Number(ethers.formatUnits(totalSupply, config.decimals)),
          assetManagerAddress,
          userBalance: Number(ethers.formatUnits(userBalance, config.decimals)),
          minimumRedeemAmount: Number(ethers.formatUnits(minimumRedeemAmount, config.decimals)),
          directMintingPaymentAddress,
        });
      } catch {
        continue;
      }
    }
    setFassets(assets);
  }, [prices, address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const redeem = useCallback(async (symbol: string, amount: string) => {
    if (!address || !window.ethereum) {
      setError("Wallet not connected");
      return;
    }
    const asset = fassets.find((item) => item.symbol === symbol);
    if (!asset) {
      setError("FAsset is not available on this network");
      return;
    }
    const amountUBA = ethers.parseUnits(amount, asset.decimals);
    if (Number(amount) < asset.minimumRedeemAmount) {
      setError(`Minimum redemption is ${asset.minimumRedeemAmount} ${asset.symbol}`);
      return;
    }
    const underlyingAddress = window.prompt(`Enter the ${asset.chain} address that will receive ${asset.underlying}:`);
    if (!underlyingAddress) return;

    setBusy(true);
    setError(null);
    setLastTxHash(null);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const assetManager = new ethers.Contract(asset.assetManagerAddress, ASSET_MANAGER_REDEEM_ABI, signer);
      const tx = await assetManager.redeemAmount(amountUBA, underlyingAddress, ethers.ZeroAddress);
      await tx.wait();
      setLastTxHash(tx.hash);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redemption failed");
    } finally {
      setBusy(false);
    }
  }, [address, fassets, refresh]);

  return { fassets, busy, error, lastTxHash, redeem, refresh };
}
