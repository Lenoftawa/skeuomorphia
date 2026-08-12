"use client";

import { useState } from "react";
import type { useGovernance, Proposal } from "@/hooks/useGovernance";
import { TokenLogo } from "./TokenLogo";

interface GovernancePanelProps {
  isConnected: boolean;
  governance: ReturnType<typeof useGovernance>;
  onConnect: () => void;
}

export function GovernancePanel({ isConnected, governance, onConnect }: GovernancePanelProps) {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const { proposals, votingPower, delegatedPower, busy, error, vote } = governance;

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>GOVERNANCE</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  const fmtVotes = (n: number) => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
  };

  const timeLeft = (endTime: number) => {
    const diff = endTime - Date.now();
    if (diff < 0) return "ENDED";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h left`;
  };

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header"><span>GOVERNANCE // FLARE IMPROVEMENT PROPOSALS</span></div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">VOTING POWER</div>
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold"><TokenLogo symbol="WFLR" size={18} />{votingPower.toFixed(2)} WFLR</div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">DELEGATED</div>
            <div className="flex items-center gap-2 text-terminal-green text-sm font-bold"><TokenLogo symbol="WFLR" size={18} />{delegatedPower.toFixed(2)} WFLR</div>
          </div>
        </div>

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}

        {selectedProposal ? (
          <div className="space-y-2">
            <button className="text-[10px] text-terminal-white-dim hover:text-terminal-amber" onClick={() => setSelectedProposal(null)}>
              ← BACK TO LIST
            </button>
            <div className="bg-terminal-panel border border-terminal-border p-3 space-y-2">
              <div className="text-terminal-amber text-sm font-bold">{selectedProposal.id}: {selectedProposal.title}</div>
              <div className={`text-[10px] ${selectedProposal.status === "active" ? "text-terminal-green" : "text-terminal-white-dim"}`}>
                STATUS: {selectedProposal.status.toUpperCase()} | {timeLeft(selectedProposal.endTime)}
              </div>
              <div className="text-terminal-white text-[10px]">{selectedProposal.description}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-terminal-green/10 border border-terminal-green/30 p-2 text-center">
                  <div className="text-terminal-green text-[10px]">FOR</div>
                  <div className="text-terminal-green text-lg font-bold glow-green">{fmtVotes(selectedProposal.forVotes)}</div>
                </div>
                <div className="bg-terminal-red/10 border border-terminal-red/30 p-2 text-center">
                  <div className="text-terminal-red text-[10px]">AGAINST</div>
                  <div className="text-terminal-red text-lg font-bold glow-red">{fmtVotes(selectedProposal.againstVotes)}</div>
                </div>
              </div>
              {selectedProposal.voted && (
                <div className="text-[10px] text-terminal-amber text-center">
                  YOU VOTED: {selectedProposal.voted.toUpperCase()}
                </div>
              )}
              {selectedProposal.status === "active" && (
                <div className="flex gap-2">
                  <button
                    className="atm-button flex-1 text-[10px] border-terminal-green text-terminal-green"
                    disabled={busy || selectedProposal.voted !== undefined}
                    onClick={() => vote(selectedProposal.id, "for")}
                  >{busy ? "..." : "[ VOTE FOR ]"}</button>
                  <button
                    className="atm-button flex-1 text-[10px] border-terminal-red text-terminal-red"
                    disabled={busy || selectedProposal.voted !== undefined}
                    onClick={() => vote(selectedProposal.id, "against")}
                  >{busy ? "..." : "[ VOTE AGAINST ]"}</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-terminal-amber text-[10px] font-bold">ACTIVE PROPOSALS</div>
            {proposals.map((p) => {
              const total = p.forVotes + p.againstVotes;
              const forPct = total > 0 ? (p.forVotes / total) * 100 : 50;
              return (
                <button
                  key={p.id}
                  className="w-full text-left bg-terminal-panel border border-terminal-border p-2 hover:border-terminal-amber/50"
                  onClick={() => setSelectedProposal(p)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-terminal-amber text-[10px] font-bold">{p.id}</span>
                    <span className={`text-[8px] ${p.status === "active" ? "text-terminal-green" : "text-terminal-white-dim"}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-terminal-white text-[10px] mt-1">{p.title}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 h-1 bg-terminal-red/30 rounded">
                      <div className="h-1 bg-terminal-green rounded" style={{ width: `${forPct}%` }} />
                    </div>
                    <span className="text-[8px] text-terminal-white-dim">{forPct.toFixed(0)}%</span>
                  </div>
                  <div className="text-[8px] text-terminal-white-dim mt-1">{timeLeft(p.endTime)}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
