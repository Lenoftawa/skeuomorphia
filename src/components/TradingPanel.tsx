"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import type { PriceFeed } from "@/lib/types";
import type { PriceHistory } from "@/hooks/useFTSO";
import { formatTokenAmount } from "@/lib/atm";
import { PriceChart } from "./PriceChart";
import { TokenLogo } from "./TokenLogo";
import { DEPLOYED_ADDRESSES, ERC20_ABI, getSimpleSwapContract } from "@/lib/contracts";

interface TradingPanelProps {
  prices: PriceFeed[];
  balance: number;
  isConnected: boolean;
  history: PriceHistory;
  signer: ethers.JsonRpcSigner | null;
}

export function TradingPanel({ prices, balance, isConnected, history, signer }: TradingPanelProps) {
  const [selectedSymbol, setSelectedSymbol] = useState("FLR");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const selectedPrice = prices.find((p) => p.symbol === selectedSymbol);
  const orderValue = selectedPrice && amount ? parseFloat(amount) * selectedPrice.price : 0;

  // Check if this symbol is swappable via SimpleSwap
  const swapTokenSymbol = selectedSymbol === "FLR" || selectedSymbol === "WFLR" ? "FLRD" : selectedSymbol === "XRP" ? "FXRP" : null;
  const canExecute = swapTokenSymbol !== null && !!DEPLOYED_ADDRESSES.simpleSwap && !!signer;

  const handleExecute = useCallback(async () => {
    if (!signer || !canExecute || !swapTokenSymbol) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    setBusy(true);
    setError(null);
    setLastTxHash(null);
    try {
      const fromSymbol = side === "BUY" ? "FLRD" : swapTokenSymbol;
      const toSymbol = side === "BUY" ? swapTokenSymbol : "FLRD";
      const fromToken = fromSymbol === "FLRD" ? DEPLOYED_ADDRESSES.stableCoin : DEPLOYED_ADDRESSES.fxrp;
      const toToken = toSymbol === "FLRD" ? DEPLOYED_ADDRESSES.stableCoin : DEPLOYED_ADDRESSES.fxrp;
      if (!fromToken || !toToken) {
        setError("Token address not configured");
        return;
      }
      const amountIn = ethers.parseUnits(amt.toString(), 6);
      // Approve
      const token = new ethers.Contract(fromToken, ERC20_ABI, signer);
      const allowance = await token.allowance(await signer.getAddress(), DEPLOYED_ADDRESSES.simpleSwap);
      if (allowance < amountIn) {
        const approveTx = await token.approve(DEPLOYED_ADDRESSES.simpleSwap, ethers.MaxUint256);
        await approveTx.wait();
      }
      // Swap
      const swap = getSimpleSwapContract(signer, DEPLOYED_ADDRESSES.simpleSwap);
      const expectedOut = await swap.getQuote.staticCall(fromToken, toToken, amountIn);
      const minAmountOut = (expectedOut * 99n) / 100n;
      const tx = await swap.swap(fromToken, toToken, amountIn, minAmountOut);
      await tx.wait();
      setLastTxHash(tx.hash);
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trade failed");
    } finally {
      setBusy(false);
    }
  }, [signer, canExecute, swapTokenSymbol, side, amount]);

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
            height={280}
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

        {/* Side Toggle */}
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

        {/* Amount Input */}
        <div>
          <div className="text-terminal-white-dim text-[10px] mb-1">AMOUNT ({selectedSymbol})</div>
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

        {/* Execution status */}
        {canExecute ? (
          <div className="border border-terminal-green/40 bg-terminal-green/10 p-2 text-[10px] text-terminal-green">
            [LIVE] Spot execution via SimpleSwap AMM (0.3% fee).
            {side === "BUY" ? ` Buy ${selectedSymbol} with FLRD.` : ` Sell ${selectedSymbol} for FLRD.`}
          </div>
        ) : (
          <div className="border border-terminal-amber/40 bg-terminal-amber/10 p-2 text-[10px] text-terminal-amber">
            [VIEW-ONLY] Spot execution available for FLRD↔FXRP pairs via SimpleSwap.
            Select FLR/XRP to enable execution. Prices are live FTSOv2 oracle reads.
          </div>
        )}

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}
        {lastTxHash && (
          <a
            href={`https://coston2-explorer.flare.network/tx/${lastTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terminal-green text-[10px] glow-green hover:underline block"
          >
            ✓ TRADE EXECUTED — VIEW TX ↗
          </a>
        )}

        <button
          className={`atm-button w-full ${canExecute ? "border-terminal-green text-terminal-green" : "opacity-50"}`}
          disabled={!canExecute || busy || !amount}
          onClick={handleExecute}
        >
          {busy ? "EXECUTING..." : canExecute ? `[ EXECUTE ${side} ORDER ]` : `[ EXECUTE — SELECT FLR/XRP ]`}
        </button>
      </div>
    </div>
  );
}
