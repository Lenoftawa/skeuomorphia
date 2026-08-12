"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { subscribeToPriceUpdates } from "@/lib/ftso";
import type { PriceFeed } from "@/lib/types";

export interface PriceHistoryPoint {
  price: number;
  timestamp: number;
}

export type PriceHistory = Record<string, PriceHistoryPoint[]>;

const MAX_HISTORY_POINTS = 500;

export function useFTSO(intervalMs: number = 5000) {
  const [prices, setPrices] = useState<PriceFeed[]>([]);
  const [history, setHistory] = useState<PriceHistory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setLoading(true);
    unsubscribeRef.current = subscribeToPriceUpdates(
      (newPrices) => {
        setPrices(newPrices);
        setLoading(false);
        setError(null);
        setHistory((prev) => {
          const next: PriceHistory = {};
          for (const feed of newPrices) {
            const existing = prev[feed.symbol] || [];
            const timestamp = feed.timestamp * 1000;
            const previousPrice = feed.change24h > -100
              ? feed.price / (1 + feed.change24h / 100)
              : feed.price;
            const seeded = existing.length === 0
              ? [{ price: previousPrice, timestamp: timestamp - 86_400_000 }]
              : existing;
            const latest = seeded[seeded.length - 1];
            const points = latest?.timestamp === timestamp
              ? seeded
              : [...seeded, { price: feed.price, timestamp }];
            next[feed.symbol] = points.slice(-MAX_HISTORY_POINTS);
          }
          return next;
        });
      },
      intervalMs,
      (requestError) => {
        setLoading(false);
        setError(requestError.message);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [intervalMs]);

  const getHistory = useCallback((symbol: string): PriceHistoryPoint[] => {
    return history[symbol] || [];
  }, [history]);

  return { prices, loading, error, history, getHistory };
}
