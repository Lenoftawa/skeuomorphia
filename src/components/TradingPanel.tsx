"use client";

import { useState } from "react";
import type { PriceFeed } from "@/lib/types";
import type { PriceHistory } from "@/hooks/useFTSO";
import { formatTokenAmount } from "@/lib/atm";
import { PriceChart } from "./PriceChart";
import { TokenLogo } from "./TokenLogo";

interface TradingPanelProps {
  prices: PriceFeed[];
  balance: number;
  isConnected: boolean;
  history: PriceHistory;
}

export function TradingPanel({ prices, balance, isConnected, history }: TradingPanelProps) {
  const [selectedSymbol, setSelectedSymbol] = useState("FLR");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState("");

  const selectedPrice = prices.find((p) => p.symbol === selectedSymbol);
  const orderValue = selectedPrice && amount ? parseFloat(amount) * selectedPrice.price : 0;

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>MARKETS // PRICE DISCOVERY</span>
        <span className="text-[10px] text-terminal-white-dim">FTSOv2 LIVE FEEDS</span>
      </div>
      <div className="terminal-content flex-1 overflow-auto space-y-3">
        {/* Symbol Selector */}
        <div>
          <div className="text-terminal-white-dim text-[10px] mb-1">SYMBOL ({prices.length} FEEDS)</div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {prices.map((p) => (
              <button
                key={p.symbol}
                className={`fn-key ${selectedSymbol === p.symbol ? "active" : ""}`}
                style={{ minWidth: "50px" }}
                onClick={() => setSelectedSymbol(p.symbol)}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <TokenLogo symbol={p.symbol} size={14} />
                  {p.symbol}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Price Chart */}
        {selectedPrice && (
          <PriceChart
            data={history[selectedSymbol] || []}
            symbol={selectedSymbol}
            height={160}
          />
        )}

        {/* Price Display */}
        {selectedPrice && (
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-2 text-terminal-white-dim">
                <TokenLogo symbol={selectedSymbol} size={20} />
                {selectedSymbol}/USD
              </span>
              <span className="text-terminal-amber glow-amber">
                ${selectedPrice.price < 1 ? selectedPrice.price.toFixed(5) : selectedPrice.price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-terminal-white-dim">24H</span>
              <span className={selectedPrice.change24h >= 0 ? "text-terminal-green" : "text-terminal-red"}>
                {selectedPrice.change24h >= 0 ? "+" : ""}{selectedPrice.change24h.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-terminal-white-dim">SOURCE</span>
              <span className="text-terminal-white-dim">{selectedPrice.source}</span>
            </div>
          </div>
        )}

        {/* Side Toggle (view only) */}
        <div className="flex gap-2">
          <button
            className={`atm-button flex-1 ${side === "BUY" ? "border-terminal-green text-terminal-green glow-green" : ""}`}
            onClick={() => setSide("BUY")}
          >
            BUY
          </button>
          <button
            className={`atm-button flex-1 ${side === "SELL" ? "border-terminal-red text-terminal-red glow-red" : ""}`}
            onClick={() => setSide("SELL")}
          >
            SELL
          </button>
        </div>

        {/* Amount Input (quote only) */}
        <div>
          <div className="text-terminal-white-dim text-[10px] mb-1">AMOUNT ({selectedSymbol}) — QUOTE PREVIEW</div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
          />
        </div>

        {/* Order Value */}
        <div className="bg-terminal-panel border border-terminal-border p-2 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-terminal-white-dim">INDICATIVE VALUE</span>
            <span className="text-terminal-white">${formatTokenAmount(orderValue)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-terminal-white-dim">FLRD BALANCE</span>
            <span className="text-terminal-amber">{isConnected ? `${formatTokenAmount(balance)} FLRD` : "—"}</span>
          </div>
        </div>

        {/* Execution unavailable notice */}
        <div className="border border-terminal-amber/40 bg-terminal-amber/10 p-2 text-[10px] text-terminal-amber">
          [VIEW-ONLY] Spot execution via SparkDEX (Uniswap V3) is not yet wired.
          Prices are live FTSOv2 oracle reads. Use the ATM [F2] to cash out
          supported assets into printable bearer notes.
        </div>
        <button className="atm-button w-full opacity-50" disabled>
          [ EXECUTE {side} ORDER — UNAVAILABLE ]
        </button>
      </div>
    </div>
  );
}
