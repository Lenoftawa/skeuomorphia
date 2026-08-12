"use client";

import { useMemo } from "react";
import { formatTokenAmount, shortenAddress } from "@/lib/atm";
import type { Transaction, PriceFeed } from "@/lib/types";
import { SUPPORTED_ASSETS } from "@/lib/flare";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { TokenLogo } from "./TokenLogo";

interface PortfolioProps {
  address: string | null;
  balance: number;
  nativeBalance: number;
  assetBalances: Record<string, number>;
  prices: PriceFeed[];
  isConnected: boolean;
  onFaucet: () => void;
  transactions: Transaction[];
}

const network = FLARE_NETWORKS[DEFAULT_NETWORK];

export function Portfolio({
  address,
  balance,
  nativeBalance,
  assetBalances,
  prices,
  isConnected,
  onFaucet,
  transactions,
}: PortfolioProps) {
  const priceMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of prices) m[p.symbol] = p.price;
    return m;
  }, [prices]);

  // Build the holdings rows: native FLR first, then each supported ERC-20.
  const rows = useMemo(() => {
    const list: { symbol: string; balance: number; price: number; usd: number; kind: string }[] = [];
    const flrPrice = priceMap["FLR"] || 0;
    list.push({
      symbol: "C2FLR",
      balance: nativeBalance,
      price: flrPrice,
      usd: nativeBalance * flrPrice,
      kind: "Native",
    });
    for (const asset of SUPPORTED_ASSETS) {
      const bal = assetBalances[asset.symbol] || 0;
      // FLRD is a test stable pegged ~1:1 to USD; FXRP prices from FTSO XRP feed.
      const price = asset.kind === "stable" ? 1 : priceMap[asset.underlying || "XRP"] || 0;
      list.push({
        symbol: asset.symbol,
        balance: bal,
        price,
        usd: bal * price,
        kind: asset.kind === "fasset" ? `FAsset · ${asset.underlying}` : "Stable",
      });
    }
    return list;
  }, [nativeBalance, assetBalances, priceMap]);

  const totalUsd = useMemo(() => rows.reduce((s, r) => s + r.usd, 0), [rows]);

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>WALLET // TX LOG</span>
        <span className="text-[10px] flex items-center">
          <span className={`status-led ${isConnected ? "led-green" : "led-red"}`} />
          {isConnected ? "CONNECTED" : "DISCONNECTED"}
        </span>
      </div>
      <div className="terminal-content flex-1 overflow-auto">
        {/* Wallet Info */}
        <div className="info-card mb-2">
          <div className="text-terminal-white-dim text-[9px] uppercase tracking-wider mb-1">Wallet</div>
          <div className="text-terminal-cyan glow-cyan text-xs font-bold break-all">
            {address ? shortenAddress(address) : "NOT CONNECTED"}
          </div>
          {address && (
            <a
              href={`${network.explorerUrl}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-terminal-amber hover:underline"
            >
              ↗ VIEW ON EXPLORER
            </a>
          )}
        </div>

        {/* Total Portfolio Value */}
        <div className="info-card mb-2">
          <div className="text-terminal-white-dim text-[9px] uppercase tracking-wider mb-1">Total Value (USD)</div>
          <div className="text-terminal-green text-lg font-bold glow-green tabular-nums">
            ${formatTokenAmount(totalUsd)}
          </div>
        </div>

        {/* Holdings */}
        <div className="info-card mb-2">
          <div className="text-terminal-white-dim text-[9px] uppercase tracking-wider mb-1.5">Holdings</div>
          {rows.map((row) => (
            <div key={row.symbol} className="data-row text-[10px] py-1">
              <span className="flex items-center gap-1.5">
                <TokenLogo symbol={row.symbol} size={16} />
                <span className="text-terminal-amber font-bold">{row.symbol}</span>
                <span className="text-terminal-white-faint text-[8px]">{row.kind}</span>
              </span>
              <span className="text-right tabular-nums">
                <span className="text-terminal-white block">{formatTokenAmount(row.balance)}</span>
                <span className="text-terminal-green text-[9px]">${formatTokenAmount(row.usd)}</span>
              </span>
            </div>
          ))}
          {!isConnected && (
            <div className="text-terminal-white-dim text-[10px] py-2 text-center">
              CONNECT WALLET TO LOAD BALANCES
            </div>
          )}
        </div>

        {/* Faucet */}
        {isConnected && (
          <button className="atm-button w-full text-[10px] mb-2" onClick={onFaucet}>
            [ CLAIM 1,000 FLRD FROM FAUCET ]
          </button>
        )}

        {/* Transaction Log */}
        <div>
          <div className="text-terminal-white-dim text-[9px] uppercase tracking-wider mb-1.5">Transaction Log</div>
          {transactions.length === 0 ? (
            <div className="border border-dashed border-terminal-border-light/70 bg-terminal-panel-dark/60 px-3 py-5 text-center">
              <div className={`mb-1.5 text-xs font-bold ${isConnected ? "text-terminal-green" : "text-terminal-amber"}`}>
                {isConnected ? "LEDGER READY" : "WALLET SESSION REQUIRED"}
              </div>
              <div className="text-terminal-white-dim text-[10px] leading-relaxed">
                {isConnected ? "CONFIRMED ACTIVITY WILL APPEAR HERE" : "OPEN ATM [F2] OR RUN CONNECT TO BEGIN"}
              </div>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <div key={i} className="data-row text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className={`status-led ${
                    tx.status === "confirmed" ? "led-green" :
                    tx.status === "pending" ? "led-amber" : "led-red"
                  }`} />
                  <span className="text-terminal-amber uppercase">{tx.type}</span>
                </span>
                <span className="text-terminal-white-dim text-right" style={{ maxWidth: "60%" }}>
                  {tx.details}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
