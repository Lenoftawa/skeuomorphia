"use client";

import { ethers } from "ethers";
import type { useEpochs } from "@/hooks/useEpochs";

interface EpochExplorerPanelProps {
  epochs: ReturnType<typeof useEpochs>;
}

export function EpochExplorerPanel({ epochs }: EpochExplorerPanelProps) {
  const { epochInfo, providers, loading, error, refresh } = epochs;

  const fmtDuration = (seconds: number) => {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>EPOCH EXPLORER // FTSO SYSTEM</span>
        <button className="text-[10px] text-terminal-white-dim hover:text-terminal-amber" onClick={refresh} disabled={loading}>
          {loading ? "LOADING..." : "[REFRESH]"}
        </button>
      </div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-2">
        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}

        {epochInfo && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-terminal-panel border border-terminal-border p-2">
              <div className="text-terminal-white-dim text-[10px]">REWARD EPOCH</div>
              <div className="text-terminal-amber text-lg font-bold">#{epochInfo.currentRewardEpoch}</div>
              <div className="text-terminal-white-dim text-[8px]">{fmtDuration(epochInfo.rewardEpochDuration)} duration</div>
            </div>
            <div className="bg-terminal-panel border border-terminal-border p-2">
              <div className="text-terminal-white-dim text-[10px]">VOTING EPOCH</div>
              <div className="text-terminal-amber text-lg font-bold">#{epochInfo.currentVotingEpoch}</div>
              <div className="text-terminal-white-dim text-[8px]">{fmtDuration(epochInfo.votingEpochDuration)} duration</div>
            </div>
          </div>
        )}

        {epochInfo && (
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">DATA PROVIDERS</div>
            <div className="text-terminal-green text-2xl font-bold glow-green">{epochInfo.dataProviderCount}</div>
          </div>
        )}

        <div>
          <div className="text-terminal-amber text-[10px] font-bold mb-1">TOP DATA PROVIDERS</div>
          {providers.length === 0 ? (
            <div className="text-terminal-white-dim text-[10px]">NO PROVIDERS LOADED</div>
          ) : (
            <div className="space-y-1">
              {providers.slice(0, 15).map((p, i) => (
                <div key={p.address} className="flex justify-between items-center bg-terminal-panel border border-terminal-border px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-white-dim text-[8px]">#{i + 1}</span>
                    <span className="text-terminal-white text-[10px]">{p.name || p.symbol || p.address.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-amber text-[10px]">{Number(ethers.formatEther(p.votePower)).toFixed(0)} VP</span>
                    <span className={`text-[8px] ${p.active ? "text-terminal-green" : "text-terminal-red"}`}>
                      {p.active ? "●" : "○"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
