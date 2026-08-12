"use client";

import type { useFlareDrop } from "@/hooks/useFlareDrop";
import { TokenLogo } from "./TokenLogo";

interface FlareDropPanelProps {
  isConnected: boolean;
  flaredrop: ReturnType<typeof useFlareDrop>;
  onConnect: () => void;
}

export function FlareDropPanel({ isConnected, flaredrop, onConnect }: FlareDropPanelProps) {
  const { claimableAmount, claimableMonths, totalClaimed, busy, error, claim, refresh } = flaredrop;

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>FLAREDROP</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>FLAREDROP // DISTRIBUTION TO DELEGATORS</span>
        <button className="text-[10px] text-terminal-white-dim hover:text-terminal-amber" onClick={refresh}>[REFRESH]</button>
      </div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-3">
        <div className="text-terminal-white-dim text-[10px]">
          FlareDrop distributes FLR tokens to WFLR delegators over 36 monthly cycles.
          Your share is proportional to your delegated WFLR.
        </div>

        <div className="bg-terminal-panel border border-terminal-border p-3">
          <div className="text-terminal-white-dim text-[10px]">CLAIMABLE FLAREDROP</div>
          <div className="flex items-center gap-2 text-terminal-green text-2xl font-bold glow-green">
            <TokenLogo symbol="FLR" size={28} />
            {claimableAmount.toFixed(6)} FLR
          </div>
          {claimableMonths.length > 0 && (
            <div className="text-terminal-white-dim text-[8px] mt-1">
              {claimableMonths.length} MONTH(S) WITH UNCLAIMED REWARDS
            </div>
          )}
        </div>

        <div className="bg-terminal-panel border border-terminal-border p-2">
          <div className="text-terminal-white-dim text-[10px]">TOTAL CLAIMED (ALL TIME)</div>
          <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold"><TokenLogo symbol="FLR" size={18} />{totalClaimed.toFixed(6)} FLR</div>
        </div>

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}

        <button
          className="atm-button w-full text-[10px] border-terminal-green text-terminal-green glow-green"
          disabled={busy || claimableAmount === 0}
          onClick={claim}
        >
          {busy ? "PROCESSING..." : "[ CLAIM FLAREDROP ]"}
        </button>

        {claimableAmount === 0 && !busy && (
          <div className="text-center text-terminal-white-dim text-[10px]">
            NO CLAIMABLE FLAREDROP AT THIS TIME.<br />
            ENSURE YOU HAVE ACTIVE WFLR DELEGATIONS.
          </div>
        )}
      </div>
    </div>
  );
}
