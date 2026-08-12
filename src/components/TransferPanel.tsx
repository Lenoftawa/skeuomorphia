"use client";

import { useState } from "react";
import type { useTransfer } from "@/hooks/useTransfer";
import { TokenLogo } from "./TokenLogo";

interface TransferPanelProps {
  isConnected: boolean;
  address: string | null;
  balance: number;
  transfer: ReturnType<typeof useTransfer>;
  onConnect: () => void;
}

export function TransferPanel({ isConnected, address, balance, transfer, onConnect }: TransferPanelProps) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"native" | "token">("native");

  const { busy, error, lastTxHash, sendNative, sendToken } = transfer;

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>TRANSFER</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!toAddress || !amount) return;
    if (mode === "native") sendNative(toAddress, amount);
    else sendToken(toAddress, amount);
  };

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header"><span>TRANSFER // SEND FUNDS</span></div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`atm-button text-[10px] ${mode === "native" ? "border-terminal-amber" : "opacity-50"}`}
            onClick={() => setMode("native")}
          ><span className="flex items-center justify-center gap-2"><TokenLogo symbol="FLR" size={16} />NATIVE FLR</span></button>
          <button
            className={`atm-button text-[10px] ${mode === "token" ? "border-terminal-amber" : "opacity-50"}`}
            onClick={() => setMode("token")}
          ><span className="flex items-center justify-center gap-2"><TokenLogo symbol="FLRD" size={16} />FLRD TOKEN</span></button>
        </div>

        <div className="bg-terminal-panel border border-terminal-border p-2">
          <div className="text-terminal-white-dim text-[10px]">YOUR BALANCE</div>
          <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold">
            <TokenLogo symbol={mode === "native" ? "FLR" : "FLRD"} size={18} />
            {mode === "native" ? `${balance.toFixed(4)} FLR` : `${balance.toFixed(2)} FLRD`}
          </div>
        </div>

        <div>
          <div className="text-terminal-amber text-[10px] font-bold mb-1">RECIPIENT ADDRESS</div>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-terminal-amber"
          />
        </div>

        <div>
          <div className="text-terminal-amber text-[10px] font-bold mb-1">AMOUNT</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
            />
            <button
              className="text-[10px] text-terminal-white-dim hover:text-terminal-amber border border-terminal-border px-2"
              onClick={() => setAmount(String(balance))}
            >MAX</button>
          </div>
        </div>

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}
        {lastTxHash && !busy && !error && (
          <div className="text-terminal-green text-[10px] glow-green">
            TX CONFIRMED: {lastTxHash.slice(0, 20)}...
          </div>
        )}

        <button
          className="atm-button w-full text-[10px]"
          disabled={busy || !toAddress || !amount}
          onClick={handleSend}
        >
          {busy ? "PROCESSING..." : `[ SEND ${mode === "native" ? "FLR" : "FLRD"} ]`}
        </button>

        <div className="text-[8px] text-terminal-white-dim border-t border-terminal-border pt-2">
          FROM: {address?.slice(0, 10)}...{address?.slice(-6)}
        </div>
      </div>
    </div>
  );
}
