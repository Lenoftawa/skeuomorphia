"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { resolveFlareContract, DEPLOYED_ADDRESSES, ERC20_ABI } from "@/lib/contracts";
import type { PriceFeed } from "@/lib/types";

export interface FAssetInfo {
  symbol: string;
  underlying: string;
  chain: string;
  decimals: number;
  price: number;
  mintFeeBps: number;
  redemptionFeeBps: number;
  collateralRatioBps: number;
  totalSupply: number;
  assetManagerAddress: string;
  tokenAddress: string;
  userBalance: number;
}

// FAssets available on Coston2 — only FXRP is live
const FASSET_REGISTRY = [
  { symbol: "FXRP", underlying: "XRP", chain: "Ripple", decimals: 6, assetManagerName: "AssetManagerFXRP", tokenAddress: "0x0b6A3645c240605887a5532109323A3E12273dc7" },
];

export function useFAssets(prices: PriceFeed[], address: string | null) {
  const [fassets, setFassets] = useState<FAssetInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const priceMap: Record<string, number> = {};
    for (const p of prices) priceMap[p.symbol] = p.price;

    const assets: FAssetInfo[] = [];
    for (const fa of FASSET_REGISTRY) {
      try {
        const amAddr = await resolveFlareContract(fa.assetManagerName, provider);
        if (!amAddr || amAddr === ethers.ZeroAddress) {
          // AssetManager not found — skip
          continue;
        }
        const AM_ABI = [
          "function getCollateralRatioBps() view returns (uint256)",
          "function getMintingFeeBps() view returns (uint256)",
          "function getRedemptionFeeBps() view returns (uint256)",
        ];
        const am = new ethers.Contract(amAddr, AM_ABI, provider);
        const token = new ethers.Contract(fa.tokenAddress, ERC20_ABI.concat(["function totalSupply() view returns (uint256)"]), provider);

        const [collateralRatioBps, mintingFeeBps, redemptionFeeBps, totalSupply, userBal] = await Promise.all([
          am.getCollateralRatioBps().catch(() => 0n),
          am.getMintingFeeBps().catch(() => 0n),
          am.getRedemptionFeeBps().catch(() => 0n),
          token.totalSupply().catch(() => 0n),
          address ? token.balanceOf(address).catch(() => 0n) : Promise.resolve(0n),
        ]);

        assets.push({
          symbol: fa.symbol,
          underlying: fa.underlying,
          chain: fa.chain,
          decimals: fa.decimals,
          price: priceMap[fa.underlying] || 0,
          mintFeeBps: Number(mintingFeeBps),
          redemptionFeeBps: Number(redemptionFeeBps),
          collateralRatioBps: Number(collateralRatioBps),
          totalSupply: Number(ethers.formatUnits(totalSupply, fa.decimals)),
          assetManagerAddress: amAddr,
          tokenAddress: fa.tokenAddress,
          userBalance: Number(ethers.formatUnits(userBal, fa.decimals)),
        });
      } catch {
        // Skip this FAsset if we can't read it
      }
    }
    setFassets(assets);
  }, [prices, address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // FAsset minting requires an XRPL payment to the Core Vault — cannot be done from EVM
  // FAsset redemption CAN be done on-chain if the user has FAsset tokens
  const redeem = useCallback(
    async (symbol: string, lots: string) => {
      if (!address) {
        setError("Wallet not connected");
        return;
      }
      const network = FLARE_NETWORKS[DEFAULT_NETWORK];
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const fa = FASSET_REGISTRY.find((f) => f.symbol === symbol);
      if (!fa) {
        setError("Unknown FAsset");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const amAddr = await resolveFlareContract(fa.assetManagerName, provider);
        if (!amAddr || amAddr === ethers.ZeroAddress) {
          setError("AssetManager not found on this network");
          return;
        }
        // Get a signer-aware provider from the browser
        const browserProvider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await browserProvider.getSigner();
        const REDEEM_ABI = [
          "function redeem(uint256 lots, string underlyingAddress, string underlyingReturnAddress) returns (uint256)",
        ];
        const am = new ethers.Contract(amAddr, REDEEM_ABI, signer);
        // For redemption, user needs to provide their underlying chain address
        // For now, use a placeholder — the user must provide their XRP address
        const underlyingAddress = prompt(`Enter your ${fa.underlying} address to receive redeemed ${fa.underlying}:`);
        if (!underlyingAddress) {
          setError("Redemption cancelled — underlying address required");
          return;
        }
        const tx = await am.redeem(BigInt(lots), underlyingAddress, underlyingAddress);
        await tx.wait();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Redemption failed");
      } finally {
        setBusy(false);
      }
    },
    [address, refresh]
  );

  return { fassets, busy, error, redeem, refresh };
}
