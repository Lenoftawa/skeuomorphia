"use client";

import { useState } from "react";
import type { PriceFeed } from "@/lib/types";
import type { PriceHistory } from "@/hooks/useFTSO";
import { Sparkline } from "./Sparkline";
import { PriceChart } from "./PriceChart";
import { TokenLogo } from "./TokenLogo";

interface MarketDataProps {
  prices: PriceFeed[];
  loading: boolean;
  error: string | null;
  history: PriceHistory;
}

export function MarketData({ prices, loading, error, history }: MarketDataProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const latestTimestamp = prices.reduce((latest, feed) => Math.max(latest, feed.timestamp), 0);
  const ageSeconds = latestTimestamp ? Math.max(0, Math.floor(Date.now() / 1000 - latestTimestamp)) : null;

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>FTSOv2 BLOCK-LATENCY FEEDS</span>
        <span className={`text-[10px] flex items-center ${error ? "text-terminal-red" : ageSeconds === null ? "text-terminal-amber" : "text-terminal-green"}`}>
          <span className={`status-led ${error ? "led-red" : ageSeconds === null ? "led-amber" : "led-green"}`} />
          {error ? "DATA ERROR" : ageSeconds === null ? "SYNCING" : `LIVE · ${ageSeconds}s`}
        </span>
      </div>

      {selectedSymbol && prices.find((p) => p.symbol === selectedSymbol) && (
        <div className="border-b border-terminal-border animate-fade-in">
          <div className="flex items-center justify-between px-3 py-1.5 bg-terminal-panel">
            <span className="flex items-center gap-2 text-terminal-amber text-[10px] font-bold tracking-wider">
              <TokenLogo symbol={selectedSymbol} size={18} />
              {selectedSymbol}/USD CHART
            </span>
            <button
              className="text-terminal-white-dim text-[10px] hover:text-terminal-red transition-colors"
              onClick={() => setSelectedSymbol(null)}
            >
              [×] CLOSE
            </button>
          </div>
          <PriceChart
            data={history[selectedSymbol] || []}
            symbol={selectedSymbol}
            height={260}
          />
        </div>
      )}

      <div className="terminal-content flex-1 overflow-auto">
        {error && <div className="mb-2 border border-terminal-red/40 bg-terminal-red/10 p-2 text-terminal-red">FTSOv2 ERROR: {error}</div>}
        <div className="grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[1fr_1fr_1fr_70px] gap-1 text-[9px] text-terminal-white-faint px-2 py-1.5 border-b border-terminal-border uppercase tracking-wider">
          <span>Symbol</span>
          <span className="text-right">Price</span>
          <span className="text-right">24H Chg</span>
          <span className="hidden text-center md:block">Chart</span>
        </div>
        {loading && prices.length === 0 ? (
          <div className="p-2" role="status">
            <div className="flex items-center gap-2 border border-terminal-amber/20 bg-terminal-amber/[0.03] px-3 py-2.5 text-terminal-amber text-xs">
              <span className="status-led led-amber" />
              <span>ESTABLISHING FTSOv2 DATA LINK</span>
              <span className="ml-auto text-terminal-white-dim">COSTON2</span>
            </div>
            <div className="mt-2 space-y-1.5 opacity-60" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_1fr_70px] gap-3 px-2 py-2 animate-pulse">
                  <span className="h-2 rounded-sm bg-terminal-amber/20" />
                  <span className="h-2 rounded-sm bg-terminal-white-faint/40" />
                  <span className="h-2 rounded-sm bg-terminal-green/10" />
                  <span className="h-2 rounded-sm bg-terminal-white-faint/30" />
                </div>
              ))}
            </div>
            <div className="mt-3 text-center text-terminal-white-dim text-[10px] tracking-wider">VERIFYING FEED REGISTRY · CALCULATING ACCESS FEE · REQUESTING PRICES</div>
          </div>
        ) : (
          prices.map((feed) => (
            <div
              key={feed.symbol}
              className={`data-row text-xs grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[1fr_1fr_1fr_70px] gap-1 items-center cursor-pointer ${selectedSymbol === feed.symbol ? "bg-terminal-amber/10 border-l-2 border-terminal-amber" : ""}`}
              onClick={() => setSelectedSymbol(feed.symbol)}
            >
              <span className="flex items-center gap-2 text-terminal-amber font-bold">
                <TokenLogo symbol={feed.symbol} size={18} />
                {feed.symbol}/USD
              </span>
              <span className="text-terminal-white text-right tabular-nums">
                ${feed.price < 1 ? feed.price.toFixed(5) : feed.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-right tabular-nums ${feed.change24h >= 0 ? "text-terminal-green glow-green" : "text-terminal-red glow-red"}`}>
                {feed.change24h >= 0 ? "+" : ""}{feed.change24h.toFixed(2)}%
              </span>
              <span className="hidden justify-center md:flex">
                <Sparkline data={history[feed.symbol] || []} width={60} height={18} />
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
