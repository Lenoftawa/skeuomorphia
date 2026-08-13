"use client";

import { formatTokenAmount, shortenAddress } from "@/lib/atm";
import type { Transaction } from "@/lib/types";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";

interface TransactionsPanelProps {
  address: string | null;
  isConnected: boolean;
  transactions: Transaction[];
}

export function TransactionsPanel({ address, isConnected, transactions }: TransactionsPanelProps) {
  const explorer = FLARE_NETWORKS[DEFAULT_NETWORK].explorerUrl;

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>TX LOG // LEDGER</span>
        <span className="text-[10px] flex items-center">
          <span className={`status-led ${isConnected ? "led-green" : "led-red"}`} />
          <span className="ml-1 text-terminal-white-dim">{isConnected && address ? shortenAddress(address) : "DISCONNECTED"}</span>
        </span>
      </div>

      <div className="terminal-content flex-1 overflow-auto space-y-2 text-xs p-2">
        <div className="flex justify-between items-center bg-terminal-panel border border-terminal-border px-2 py-1">
          <span className="text-terminal-white-dim text-[10px]">TOTAL ENTRIES</span>
          <span className="text-terminal-amber font-bold">{transactions.length}</span>
        </div>

        {transactions.length === 0 ? (
          <div className="border border-dashed border-terminal-border-light/70 bg-terminal-panel-dark/60 px-3 py-8 text-center">
            <div className={`mb-2 text-sm font-bold ${isConnected ? "text-terminal-green" : "text-terminal-amber"}`}>
              {isConnected ? "LEDGER READY" : "WALLET SESSION REQUIRED"}
            </div>
            <div className="text-terminal-white-dim text-[10px] leading-relaxed">
              {isConnected
                ? "CONFIRMED ONSHAIN ACTIVITY WILL APPEAR HERE"
                : "OPEN ATM [F2] OR RUN CONNECT TO BEGIN"}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx, i) => (
              <div key={i} className="data-row text-[10px] flex-col items-start gap-1">
                <div className="flex w-full justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className={`status-led ${
                      tx.status === "confirmed" ? "led-green" :
                      tx.status === "pending" ? "led-amber" : "led-red"
                    }`} />
                    <span className="text-terminal-amber uppercase font-bold">{tx.type}</span>
                  </span>
                  <span className="text-terminal-white-dim text-[8px]">
                    {tx.hash ? (
                      <a
                        href={`${explorer}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-cyan hover:text-terminal-amber underline"
                      >
                        {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)}
                      </a>
                    ) : "—"}
                  </span>
                </div>
                <div className="text-terminal-white-dim w-full">{tx.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
