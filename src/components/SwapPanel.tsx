"use client";

import { useState, useMemo } from "react";
import { FTSO_SYMBOLS } from "@/lib/flare";
import type { PriceFeed } from "@/lib/types";
import type { useSwap } from "@/hooks/useSwap";
import { TokenLogo } from "./TokenLogo";

interface SwapPanelProps {
  isConnected: boolean;
  prices: PriceFeed[];
  swap: ReturnType<typeof useSwap>;
  onConnect: () => void;
}

export function SwapPanel({ isConnected, prices, swap, onConnect }: SwapPanelProps) {
  const [fromSymbol, setFromSymbol] = useState("FLR");
  const [toSymbol, setToSymbol] = useState("USDC");
  const [fromAmount, setFromAmount] = useState("");
  const { busy, error, lastSwap, getQuote, executeSwap } = swap;

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>DEX SWAP</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  const quote = useMemo(
    () => {
      const amt = parseFloat(fromAmount);
      if (!isNaN(amt) && amt > 0) return getQuote(fromSymbol, toSymbol, amt);
      return null;
    },
    [fromSymbol, toSymbol, fromAmount, getQuote]
  );

  const handleSwap = () => {
    const amt = parseFloat(fromAmount);
    if (!isNaN(amt) && amt > 0) {
      executeSwap(fromSymbol, toSymbol, amt).then(() => setFromAmount(""));
    }
  };

  const flip = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
  };

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header"><span>DEX SWAP // FTSO-PRICED SWAPS</span></div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-3">
        <div className="text-terminal-white-dim text-[10px]">
          Swap tokens using live FTSO price feeds. Demo mode — no actual DEX integration.
        </div>

        <div className="space-y-2">
          <div className="text-terminal-amber text-[10px] font-bold">FROM</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
            />
            <TokenLogo symbol={fromSymbol} size={22} />
            <select
              value={fromSymbol}
              onChange={(e) => setFromSymbol(e.target.value)}
              className="bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
            >
              {FTSO_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="text-center">
          <button
            className="text-terminal-amber text-sm hover:text-terminal-green"
            onClick={flip}
            title="Flip"
          >⇅</button>
        </div>

        <div className="space-y-2">
          <div className="text-terminal-amber text-[10px] font-bold">TO</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={quote ? quote.toAmount.toFixed(6) : ""}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-green px-2 py-1 text-sm focus:outline-none"
            />
            <TokenLogo symbol={toSymbol} size={22} />
            <select
              value={toSymbol}
              onChange={(e) => setToSymbol(e.target.value)}
              className="bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
            >
              {FTSO_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {quote && (
          <div className="bg-terminal-panel border border-terminal-border p-2 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-terminal-white-dim">RATE</span>
              <span className="text-terminal-white">1 {fromSymbol} = {quote.rate.toFixed(6)} {toSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-white-dim">PRICE IMPACT</span>
              <span className={quote.priceImpact > 3 ? "text-terminal-red" : "text-terminal-green"}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-white-dim">MIN RECEIVED</span>
              <span className="text-terminal-white">{quote.minReceived.toFixed(6)} {toSymbol}</span>
            </div>
          </div>
        )}

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}
        {lastSwap && !busy && !error && (
          <div className="text-terminal-green text-[10px] glow-green">✓ {lastSwap}</div>
        )}

        <button
          className="atm-button w-full text-[10px] border-terminal-green text-terminal-green"
          disabled={busy || !fromAmount || !quote}
          onClick={handleSwap}
        >
          {busy ? "PROCESSING..." : `[ SWAP ${fromSymbol} → ${toSymbol} ]`}
        </button>
      </div>
    </div>
  );
}
