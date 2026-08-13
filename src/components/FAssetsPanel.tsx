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
  const [redeemLots, setRedeemLots] = useState("");
  const [view, setView] = useState<"list" | "mint" | "redeem">("list");
  const { fassets: assets, busy, error, redeem } = fassets;

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

        {assets.length === 0 && (
          <div className="text-terminal-white-dim text-[10px] text-center py-4">
            No FAssets found on this network.
          </div>
        )}

        {view === "list" && (
          <div className="space-y-1">
            <div className="text-terminal-amber text-[10px] font-bold">AVAILABLE F-ASSETS</div>
            <div className="text-terminal-white-dim text-[8px] mb-2">
              Real on-chain data from Flare AssetManager. Collateralized by L1 assets.
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
                <div className="grid grid-cols-2 gap-1 mt-1 text-[8px] text-terminal-white-dim">
                  <div>SUPPLY: {a.totalSupply.toLocaleString()}</div>
                  <div>YOUR BAL: {a.userBalance.toFixed(4)}</div>
                  <div>MINT FEE: {a.mintFeeBps / 100}%</div>
                  <div>REDEEM FEE: {a.redemptionFeeBps / 100}%</div>
                  <div>COLLATERAL RATIO: {a.collateralRatioBps / 100}%</div>
                  <div>AM: {a.assetManagerAddress.slice(0, 8)}...{a.assetManagerAddress.slice(-4)}</div>
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    className="atm-button flex-1 text-[9px] border-terminal-amber text-terminal-amber"
                    onClick={() => { setSelectedAsset(a.symbol); setView("mint"); }}
                  >[ MINT INFO ]</button>
                  <button
                    className="atm-button flex-1 text-[9px] border-terminal-red text-terminal-red"
                    disabled={a.userBalance === 0}
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
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold">
              <TokenLogo symbol={selected.symbol} size={22} />MINT {selected.symbol}
            </div>
            <div className="bg-terminal-panel border border-terminal-border p-2 space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-terminal-white-dim">PRICE</span><span className="text-terminal-green">${selected.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-terminal-white-dim">MINT FEE</span><span>{selected.mintFeeBps / 100}%</span></div>
              <div className="flex justify-between"><span className="text-terminal-white-dim">COLLATERAL RATIO</span><span>{selected.collateralRatioBps / 100}%</span></div>
            </div>
            <div className="border border-terminal-amber/40 bg-terminal-amber/10 p-2 text-[10px] text-terminal-amber">
              <div className="font-bold mb-1">HOW TO MINT {selected.symbol}:</div>
              <div>1. Send {selected.underlying} to the {selected.symbol} Core Vault on the {selected.chain} network</div>
              <div>2. Include a memo with your Flare address (32-byte direct minting format)</div>
              <div>3. An executor finalizes the mint on Flare — you receive {selected.symbol}</div>
              <div className="mt-1 text-terminal-white-dim">Minting requires a cross-chain {selected.chain} payment. It cannot be initiated from this EVM terminal.</div>
            </div>
            <div className="text-[8px] text-terminal-white-dim">
              AssetManager: {selected.assetManagerAddress}
            </div>
          </div>
        )}

        {view === "redeem" && selected && (
          <div className="space-y-2">
            <button className="text-[10px] text-terminal-white-dim hover:text-terminal-amber" onClick={() => setView("list")}>
              ← BACK
            </button>
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold">
              <TokenLogo symbol={selected.symbol} size={22} />REDEEM {selected.symbol}
            </div>
            <div className="text-terminal-white-dim text-[10px]">
              Burn {selected.symbol} to recover {selected.underlying} on the {selected.chain} network.
              Your balance: {selected.userBalance.toFixed(6)} {selected.symbol}
            </div>
            <div className="bg-terminal-panel border border-terminal-border p-2 space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-terminal-white-dim">PRICE</span><span className="text-terminal-green">${selected.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-terminal-white-dim">REDEMPTION FEE</span><span>{selected.redemptionFeeBps / 100}%</span></div>
            </div>
            <div>
              <div className="text-terminal-amber text-[10px] font-bold mb-1">LOTS TO REDEEM</div>
              <input
                type="number"
                value={redeemLots}
                onChange={(e) => setRedeemLots(e.target.value)}
                placeholder="0"
                className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
              />
              <div className="text-[8px] text-terminal-white-dim mt-1">
                You will be prompted for your {selected.underlying} address.
              </div>
            </div>
            <button
              className="atm-button w-full text-[10px] border-terminal-red text-terminal-red"
              disabled={busy || !redeemLots}
              onClick={() => redeem(selected.symbol, redeemLots).then(() => { setView("list"); setRedeemLots(""); })}
            >
              {busy ? "PROCESSING..." : `[ REDEEM ${selected.symbol} ]`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
