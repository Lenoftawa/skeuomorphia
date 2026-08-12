"use client";

import { useState } from "react";
import type { useFAssets } from "@/hooks/useFAssets";
import { TokenLogo } from "./TokenLogo";

interface FAssetsPanelProps {
  isConnected: boolean;
  fassets: ReturnType<typeof useFAssets>;
  onConnect: () => void;
}

export function FAssetsPanel({ isConnected, fassets, onConnect }: FAssetsPanelProps) {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [mintAmount, setMintAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [view, setView] = useState<"list" | "mint" | "redeem">("list");
  const { fassets: assets, busy, error, mint, redeem } = fassets;

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>F-ASSETS</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  const selected = assets.find((a) => a.symbol === selectedAsset);

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header"><span>F-ASSETS // WRAPPED LAYER-1 ASSETS</span></div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-2">
        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}

        {view === "list" && (
          <div className="space-y-1">
            <div className="text-terminal-amber text-[10px] font-bold">AVAILABLE F-ASSETS</div>
            <div className="text-terminal-white-dim text-[8px] mb-2">
              Mint wrapped L1 assets using FTSO price feeds as collateral
            </div>
            {assets.map((a) => (
              <div
                key={a.symbol}
                className="bg-terminal-panel border border-terminal-border p-2 hover:border-terminal-amber/50"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TokenLogo symbol={a.symbol} size={24} />
                    <div>
                      <span className="text-terminal-amber text-sm font-bold">{a.symbol}</span>
                      <span className="text-terminal-white-dim text-[10px] ml-2">← {a.chain}</span>
                    </div>
                  </div>
                  <div className="text-terminal-green text-sm">${a.price.toFixed(a.decimals > 4 ? 2 : a.decimals)}</div>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-[8px] text-terminal-white-dim">
                  <div>SUPPLY: {a.totalSupply.toLocaleString()}</div>
                  <div>FEE: {a.mintFee}%</div>
                  <div>CR: {a.collateralRatio}%</div>
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    className="atm-button flex-1 text-[9px] border-terminal-green text-terminal-green"
                    onClick={() => { setSelectedAsset(a.symbol); setView("mint"); }}
                  >[ MINT ]</button>
                  <button
                    className="atm-button flex-1 text-[9px] border-terminal-red text-terminal-red"
                    onClick={() => { setSelectedAsset(a.symbol); setView("redeem"); }}
                  >[ REDEEM ]</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "mint" && selected && (
          <div className="space-y-2">
            <button className="text-[10px] text-terminal-white-dim hover:text-terminal-amber" onClick={() => setView("list")}>
              ← BACK
            </button>
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold"><TokenLogo symbol={selected.symbol} size={22} />MINT {selected.symbol}</div>
            <div className="text-terminal-white-dim text-[10px]">
              Collateralize {selected.underlying} to mint {selected.symbol}
            </div>
            <div className="bg-terminal-panel border border-terminal-border p-2 space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-terminal-white-dim">PRICE</span><span className="text-terminal-green">${selected.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-terminal-white-dim">MINT FEE</span><span>{selected.mintFee}%</span></div>
              <div className="flex justify-between"><span className="text-terminal-white-dim">COLLATERAL RATIO</span><span>{selected.collateralRatio}%</span></div>
            </div>
            <div>
              <div className="text-terminal-amber text-[10px] font-bold mb-1">AMOUNT ({selected.underlying})</div>
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
              />
            </div>
            <button
              className="atm-button w-full text-[10px] border-terminal-green text-terminal-green"
              disabled={busy || !mintAmount}
              onClick={() => mint(selected.symbol, mintAmount).then(() => { setView("list"); setMintAmount(""); })}
            >
              {busy ? "PROCESSING..." : `[ MINT ${selected.symbol} ]`}
            </button>
          </div>
        )}

        {view === "redeem" && selected && (
          <div className="space-y-2">
            <button className="text-[10px] text-terminal-white-dim hover:text-terminal-amber" onClick={() => setView("list")}>
              ← BACK
            </button>
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold"><TokenLogo symbol={selected.symbol} size={22} />REDEEM {selected.symbol}</div>
            <div className="text-terminal-white-dim text-[10px]">
              Burn {selected.symbol} to recover {selected.underlying}
            </div>
            <div className="bg-terminal-panel border border-terminal-border p-2 space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-terminal-white-dim">PRICE</span><span className="text-terminal-green">${selected.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-terminal-white-dim">REDEMPTION FEE</span><span>{selected.redemptionFee}%</span></div>
            </div>
            <div>
              <div className="text-terminal-amber text-[10px] font-bold mb-1">AMOUNT ({selected.symbol})</div>
              <input
                type="number"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
              />
            </div>
            <button
              className="atm-button w-full text-[10px] border-terminal-red text-terminal-red"
              disabled={busy || !redeemAmount}
              onClick={() => redeem(selected.symbol, redeemAmount).then(() => { setView("list"); setRedeemAmount(""); })}
            >
              {busy ? "PROCESSING..." : `[ REDEEM ${selected.symbol} ]`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
