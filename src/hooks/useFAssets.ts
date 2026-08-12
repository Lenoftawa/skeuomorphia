"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK, FASSET_TYPES } from "@/lib/flare";
import { resolveFlareContract } from "@/lib/contracts";
import type { PriceFeed } from "@/lib/types";

export interface FAssetInfo {
  symbol: string;
  underlying: string;
  chain: string;
  decimals: number;
  price: number;
  mintFee: number;
  redemptionFee: number;
  collateralRatio: number;
  totalSupply: number;
}

export function useFAssets(prices: PriceFeed[], address: string | null) {
  const [fassets, setFassets] = useState<FAssetInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const priceMap: Record<string, number> = {};
    for (const p of prices) priceMap[p.symbol] = p.price;

    const assets: FAssetInfo[] = FASSET_TYPES.map((fa) => ({
      ...fa,
      price: priceMap[fa.underlying] || 0,
      mintFee: 0.5,
      redemptionFee: 0.3,
      collateralRatio: 130,
      totalSupply: Math.floor(Math.random() * 1000000) + 10000,
    }));
    setFassets(assets);
  }, [prices]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mint = useCallback(
    async (symbol: string, amount: string) => {
      setBusy(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Mint failed");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const redeem = useCallback(
    async (symbol: string, amount: string) => {
      setBusy(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Redeem failed");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  return { fassets, busy, error, mint, redeem, refresh };
}
