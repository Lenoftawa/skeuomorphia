"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PriceFeed } from "@/lib/types";

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: "above" | "below";
  threshold: number;
  active: boolean;
  triggered: boolean;
  createdAt: number;
  triggeredAt: number | null;
  triggerPrice: number | null;
}

const STORAGE_KEY = "flare-price-alerts";

function loadAlerts(): PriceAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveAlerts(alerts: PriceAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {}
}

export function usePriceAlerts(prices: PriceFeed[]) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);
  const [newAlertSymbol, setNewAlertSymbol] = useState("");
  const [newAlertCondition, setNewAlertCondition] = useState<"above" | "below">("above");
  const [newAlertThreshold, setNewAlertThreshold] = useState("");
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    if (prices.length === 0) return;
    const priceMap: Record<string, number> = {};
    for (const p of prices) priceMap[p.symbol] = p.price;

    setAlerts((prev) => {
      let changed = false;
      const next = prev.map((alert) => {
        if (!alert.active || alert.triggered) return alert;
        const currentPrice = priceMap[alert.symbol];
        if (currentPrice === undefined) return alert;

        if (alert.condition === "above" && currentPrice >= alert.threshold) {
          changed = true;
          return {
            ...alert,
            triggered: true,
            triggeredAt: Date.now(),
            triggerPrice: currentPrice,
          };
        }
        if (alert.condition === "below" && currentPrice <= alert.threshold) {
          changed = true;
          return {
            ...alert,
            triggered: true,
            triggeredAt: Date.now(),
            triggerPrice: currentPrice,
          };
        }
        return alert;
      });
      return changed ? next : prev;
    });

    prevPricesRef.current = priceMap;
  }, [prices]);

  const addAlert = useCallback(
    (symbol: string, condition: "above" | "below", threshold: number) => {
      const alert: PriceAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        symbol,
        condition,
        threshold,
        active: true,
        triggered: false,
        createdAt: Date.now(),
        triggeredAt: null,
        triggerPrice: null,
      };
      setAlerts((prev) => [...prev, alert]);
    },
    []
  );

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, active: !a.active, triggered: false, triggeredAt: null, triggerPrice: null } : a
      )
    );
  }, []);

  const clearTriggered = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => !a.triggered));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  const handleAddAlert = useCallback(() => {
    const sym = newAlertSymbol || "FLR";
    const thresh = parseFloat(newAlertThreshold);
    if (!isNaN(thresh) && thresh > 0) {
      addAlert(sym, newAlertCondition, thresh);
      setNewAlertThreshold("");
    }
  }, [newAlertSymbol, newAlertCondition, newAlertThreshold, addAlert]);

  const triggeredAlerts = alerts.filter((a) => a.triggered);
  const activeAlerts = alerts.filter((a) => a.active && !a.triggered);

  return {
    alerts,
    triggeredAlerts,
    activeAlerts,
    newAlertSymbol,
    newAlertCondition,
    newAlertThreshold,
    setNewAlertSymbol,
    setNewAlertCondition,
    setNewAlertThreshold,
    handleAddAlert,
    removeAlert,
    toggleAlert,
    clearTriggered,
    clearAll,
  };
}
