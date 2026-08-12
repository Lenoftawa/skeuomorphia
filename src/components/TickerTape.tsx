"use client";

import type { PriceFeed } from "@/lib/types";
import { TokenLogo } from "./TokenLogo";

export function TickerTape({ prices }: { prices: PriceFeed[] }) {
  if (prices.length === 0) {
    return (
      <div className="h-7 bg-terminal-panel-dark border-b border-terminal-border overflow-hidden flex items-center">
        <div className="bg-gradient-to-r from-terminal-amber to-terminal-amber-dim text-black px-3 h-full flex items-center font-bold text-xs tracking-wider rounded-br">
          ◈ FLARE-T
        </div>
        <span className="flex items-center gap-2 overflow-hidden whitespace-nowrap px-3 text-terminal-amber text-xs">
          <span className="status-led led-amber" />FTSOv2 LINK
          <span className="hidden text-terminal-white-dim sm:inline">INITIALIZING LIVE MARKET TAPE...</span>
        </span>
      </div>
    );
  }

  const items = [...prices, ...prices];

  return (
    <div className="h-7 bg-terminal-panel-dark border-b border-terminal-border overflow-hidden flex items-center">
      <div className="bg-gradient-to-r from-terminal-amber to-terminal-amber-dim text-black px-3 h-full flex items-center font-bold text-xs whitespace-nowrap tracking-wider rounded-br">
        ◈ FLARE-T
      </div>
      <div className="overflow-hidden flex-1">
        <div className="ticker-track">
          {items.map((feed, i) => (
            <span key={i} className="inline-flex items-center px-4 text-xs whitespace-nowrap">
              <TokenLogo symbol={feed.symbol} size={15} className="mr-1.5" />
              <span className="text-terminal-white-dim">{feed.symbol}/USD</span>
              <span className="text-terminal-white ml-1.5 tabular-nums">
                ${feed.price < 1 ? feed.price.toFixed(5) : feed.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`ml-1.5 ${feed.change24h >= 0 ? "text-terminal-green glow-green" : "text-terminal-red glow-red"}`}>
                {feed.change24h >= 0 ? "▲" : "▼"}{Math.abs(feed.change24h).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
