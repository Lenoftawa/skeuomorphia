"use client";

import { useState, useCallback } from "react";
import type { PriceFeed } from "@/lib/types";

export interface SwapQuote {
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  priceImpact: number;
  minReceived: number;
}

export function useSwap(prices: PriceFeed[]) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSwap, setLastSwap] = useState<string | null>(null);

  const getQuote = useCallback(
    (fromSymbol: string, toSymbol: string, fromAmount: number): SwapQuote | null => {
      const fromPrice = prices.find((p) => p.symbol === fromSymbol)?.price || 0;
      const toPrice = prices.find((p) => p.symbol === toSymbol)?.price || 0;
      if (!fromPrice || !toPrice || !fromAmount) return null;

      const usdValue = fromAmount * fromPrice;
      const rawToAmount = usdValue / toPrice;
      const priceImpact = Math.min((fromAmount / 10000) * 100, 5);
      const minReceived = rawToAmount * (1 - priceImpact / 100);

      return {
        fromSymbol,
        toSymbol,
        fromAmount,
        toAmount: rawToAmount,
        rate: rawToAmount / fromAmount,
        priceImpact,
        minReceived,
      };
    },
    [prices]
  );

  const executeSwap = useCallback(
    async (fromSymbol: string, toSymbol: string, fromAmount: number) => {
      setBusy(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setLastSwap(
          `Swapped ${fromAmount} ${fromSymbol} → ${toSymbol}`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Swap failed");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  return { busy, error, lastSwap, getQuote, executeSwap };
}
