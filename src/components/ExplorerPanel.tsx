"use client";

import { useState, useEffect } from "react";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import type { useExplorer } from "@/hooks/useExplorer";
import { TokenLogo } from "./TokenLogo";

interface ExplorerPanelProps {
  isConnected: boolean;
  address: string | null;
  explorer: ReturnType<typeof useExplorer>;
  onConnect: () => void;
}

export function ExplorerPanel({ isConnected, address, explorer, onConnect }: ExplorerPanelProps) {
  const [fetched, setFetched] = useState(false);
  const { transactions, loading, error, fetchTransactions } = explorer;
  const network = FLARE_NETWORKS[DEFAULT_NETWORK];

  useEffect(() => {
    if (isConnected && address && !fetched) {
      fetchTransactions(address);
      setFetched(true);
    }
  }, [isConnected, address, fetched, fetchTransactions]);

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>EXPLORER</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  const fmtValue = (wei: string) => {
    try {
      const val = Number(wei) / 1e18;
      if (val === 0) return "0";
      return val.toFixed(6);
    } catch {
      return wei;
    }
  };

  const fmtTime = (ts: number) => {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleString();
  };

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>EXPLORER // ON-CHAIN TX HISTORY</span>
        <button
          className="text-[10px] text-terminal-white-dim hover:text-terminal-amber"
          onClick={() => address && fetchTransactions(address)}
          disabled={loading}
        >
          {loading ? "LOADING..." : "[REFRESH]"}
        </button>
      </div>
      <div className="terminal-content flex-1 overflow-auto text-xs p-2">
        {error && <div className="text-terminal-red text-[10px] glow-red mb-2">ERROR: {error}</div>}

        {loading && transactions.length === 0 && (
          <div className="text-terminal-amber text-[10px] animate-blink">FETCHING TRANSACTIONS...</div>
        )}

        {!loading && transactions.length === 0 && !error && (
          <div className="text-terminal-white-dim text-[10px]">NO TRANSACTIONS FOUND</div>
        )}

        <div className="space-y-1">
          {transactions.map((tx) => (
            <div key={tx.hash} className="bg-terminal-panel border border-terminal-border p-2">
              <div className="flex justify-between items-start">
                <a
                  href={`${network.explorerUrl}/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terminal-amber text-[10px] font-mono hover:underline"
                >
                  {tx.hash.slice(0, 18)}...{tx.hash.slice(-4)}
                </a>
                <span className={`text-[8px] ${tx.status ? "text-terminal-green" : "text-terminal-red"}`}>
                  {tx.status ? "✓ SUCCESS" : "✗ FAILED"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1 text-[8px] text-terminal-white-dim">
                <div>FROM: {tx.from.slice(0, 10)}...{tx.from.slice(-4)}</div>
                <div>TO: {tx.to.slice(0, 10)}...{tx.to.slice(-4)}</div>
                <div className="flex items-center gap-1.5"><TokenLogo symbol="FLR" size={15} />VALUE: {fmtValue(tx.value)} FLR</div>
                <div>{fmtTime(tx.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
