"use client";

import { useState, useCallback } from "react";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";

export interface ExplorerTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: boolean;
  gasUsed: string;
}

export function useExplorer() {
  const [transactions, setTransactions] = useState<ExplorerTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (address: string) => {
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    setLoading(true);
    setError(null);
    try {
      const url = `${network.explorerApi}/v2/addresses/${address}/transactions`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Explorer API returned ${resp.status}`);
      const data = await resp.json();
      const items: Record<string, unknown>[] = Array.isArray(data.items) ? data.items : [];
      const txs: ExplorerTx[] = items.slice(0, 50).map((item: Record<string, unknown>) => {
        const from = item.from as Record<string, unknown> | undefined;
        const to = item.to as Record<string, unknown> | undefined;
        return {
          hash: String(item.hash || ""),
          from: String(from?.hash || ""),
          to: String(to?.hash || ""),
          value: String(item.value || "0"),
          timestamp: Number(item.timestamp || 0),
          status: Boolean(item.status),
          gasUsed: String(item.gas_used || "0"),
        };
      });
      setTransactions(txs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { transactions, loading, error, fetchTransactions };
}
