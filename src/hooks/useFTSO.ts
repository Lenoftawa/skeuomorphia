"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { subscribeToPriceUpdates, fetchFtsoHistory } from "@/lib/ftso";
import type { PriceFeed } from "@/lib/types";
import type { PriceHistory, PriceHistoryPoint } from "@/lib/ftso";

export type { PriceHistoryPoint, PriceHistory };

const MAX_HISTORY_POINTS = 500;
const HISTORY_ROUNDS = 20; // ~30 min of 90s voting rounds
const HISTORY_DELAY_MS = 3000; // wait for live prices first, then fetch history

export function useFTSO(intervalMs: number = 5000) {
  const [prices, setPrices] = useState<PriceFeed[]>([]);
  const [history, setHistory] = useState<PriceHistory>({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Seed history with real past anchor-feed data so charts/sparklines aren't
  // empty until enough live ticks accumulate. Delayed so the live price
  // subscription gets priority and we don't compete for DA API rate limits.
  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    const timer = setTimeout(() => {
      if (cancelled) return;
      fetchFtsoHistory(HISTORY_ROUNDS)
        .then((seeded) => {
          if (cancelled) return;
          setHistory((prev) => {
            const next: PriceHistory = { ...prev };
            for (const [symbol, points] of Object.entries(seeded)) {
              const existing = prev[symbol] || [];
              // Drop seeded points that are newer than any already-collected point.
              const cutoff = existing.length > 0 ? existing[0].timestamp : Infinity;
              const kept = points.filter((p) => p.timestamp < cutoff);
              next[symbol] = [...kept, ...existing].slice(-MAX_HISTORY_POINTS);
            }
            return next;
          });
        })
        .catch(() => {
          // History seeding is best-effort; live subscription still works.
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false);
        });
    }, HISTORY_DELAY_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

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

  return { prices, loading, historyLoading, error, history, getHistory };
}
