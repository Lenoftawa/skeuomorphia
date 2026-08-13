"use client";

import type { useEpochs } from "@/hooks/useEpochs";

interface EpochExplorerPanelProps {
  epochs: ReturnType<typeof useEpochs>;
}

export function EpochExplorerPanel({ epochs }: EpochExplorerPanelProps) {
  const { epochInfo, loading, error, refresh } = epochs;

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

        {loading && !epochInfo && (
          <div className="text-terminal-amber text-[10px] animate-pulse">FETCHING EPOCH DATA...</div>
        )}

        {!loading && !epochInfo && !error && (
          <div className="text-terminal-white-dim text-[10px]">NO EPOCH DATA AVAILABLE</div>
        )}

        <div className="bg-terminal-panel border border-terminal-border p-2">
          <div className="text-terminal-white-dim text-[10px] mb-1">FTSOv2 SYSTEM</div>
          <div className="text-terminal-white text-[10px] space-y-1">
            <div>• Block-latency feeds update every ~1.8s</div>
            <div>• Voting epoch: {epochInfo ? fmtDuration(epochInfo.votingEpochDuration) : "—"}</div>
            <div>• Reward epoch: {epochInfo ? fmtDuration(epochInfo.rewardEpochDuration) : "—"}</div>
            <div className="text-terminal-white-dim">Data provider enumeration is not available on FTSOv2 FtsoManager.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
