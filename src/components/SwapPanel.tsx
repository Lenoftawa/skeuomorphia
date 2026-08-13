"use client";

import { useState, useEffect, useCallback } from "react";
import type { useSwap, SwapQuote } from "@/hooks/useSwap";
import { TokenLogo } from "./TokenLogo";

interface SwapPanelProps {
  isConnected: boolean;
  swap: ReturnType<typeof useSwap>;
  onConnect: () => void;
}

export function SwapPanel({ isConnected, swap, onConnect }: SwapPanelProps) {
  const [fromSymbol, setFromSymbol] = useState("FLRD");
  const [toSymbol, setToSymbol] = useState("FXRP");
  const [fromAmount, setFromAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const { busy, error, lastSwap, lastTxHash, getOnChainQuote, executeSwap, swapTokens } = swap;

  const fetchQuote = useCallback(async () => {
    const amt = parseFloat(fromAmount);
    if (!isNaN(amt) && amt > 0) {
      setQuoteLoading(true);
      try {
        const q = await getOnChainQuote(fromSymbol, toSymbol, amt);
        setQuote(q);
      } catch {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    } else {
      setQuote(null);
    }
  }, [fromSymbol, toSymbol, fromAmount, getOnChainQuote]);

  useEffect(() => {
    const timeout = setTimeout(fetchQuote, 300);
    return () => clearTimeout(timeout);
  }, [fetchQuote]);

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

  const handleSwap = () => {
    const amt = parseFloat(fromAmount);
    if (!isNaN(amt) && amt > 0) {
      executeSwap(fromSymbol, toSymbol, amt).then(() => setFromAmount(""));
    }
  };

  const flip = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setQuote(null);
  };

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header"><span>DEX SWAP // SIMPLESWAP AMM</span></div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-3">
        <div className="text-terminal-white-dim text-[10px]">
          On-chain constant-product AMM (0.3% fee). Real settlement via SimpleSwap contract.
        </div>

        {!swapTokens.find((t) => t.address) && (
          <div className="border border-terminal-red/40 bg-terminal-red/10 p-2 text-[10px] text-terminal-red">
            Swap contract not configured. Set NEXT_PUBLIC_SIMPLE_SWAP_ADDRESS.
          </div>
        )}

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
              onChange={(e) => { setFromSymbol(e.target.value); setQuote(null); }}
              className="bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
            >
              {swapTokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
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
              value={quote ? quote.toAmount.toFixed(6) : quoteLoading ? "..." : ""}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-green px-2 py-1 text-sm focus:outline-none"
            />
            <TokenLogo symbol={toSymbol} size={22} />
            <select
              value={toSymbol}
              onChange={(e) => { setToSymbol(e.target.value); setQuote(null); }}
              className="bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
            >
              {swapTokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
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
              <span className="text-terminal-white-dim">MIN RECEIVED (1% SLIPPAGE)</span>
              <span className="text-terminal-white">{quote.minReceived.toFixed(6)} {toSymbol}</span>
            </div>
          </div>
        )}

        {!quote && !quoteLoading && fromAmount && (
          <div className="text-terminal-white-dim text-[10px]">
            No liquidity for this pair. Available pairs: FLRD↔FXRP
          </div>
        )}

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}
        {lastSwap && !busy && !error && (
          <div className="text-terminal-green text-[10px] glow-green">✓ {lastSwap}</div>
        )}
        {lastTxHash && (
          <a
            href={`https://coston2-explorer.flare.network/tx/${lastTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terminal-cyan text-[8px] hover:underline block"
          >
            VIEW TX ON EXPLORER ↗
          </a>
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
