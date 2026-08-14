"use client";

import { useState } from "react";
import type { useStaking } from "@/hooks/useStaking";
import { TokenLogo } from "./TokenLogo";

interface StakingPanelProps {
  isConnected: boolean;
  staking: ReturnType<typeof useStaking>;
  onConnect: () => void;
}

export function StakingPanel({ isConnected, staking, onConnect }: StakingPanelProps) {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const {
    wNatBalance,
    rNatBalance,
    lockedBalance,
    unlockedBalance,
    projects,
    currentMonth,
    rNatAccount,
    totalClaimable,
    busy,
    error,
    lastTxHash,
    rnatAddress,
    claimRewards,
    withdraw,
    withdrawAll,
    refresh,
  } = staking;

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>rFLR REWARDS</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>rFLR REWARDS // RNat PROTOCOL</span>
        <button className="text-[10px] text-terminal-white-dim hover:text-terminal-amber" onClick={refresh}>[REFRESH]</button>
      </div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-3">
        <div className="text-terminal-white-dim text-[10px]">
          rFLR represents vested project rewards backed by WFLR in your dedicated RNat account.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">rFLR BALANCE</div>
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold"><TokenLogo symbol="rFLR" size={18} />{rNatBalance.toFixed(6)}</div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">CLAIMABLE REWARDS</div>
            <div className="flex items-center gap-2 text-terminal-green text-sm font-bold"><TokenLogo symbol="WFLR" size={18} />{totalClaimable.toFixed(6)} WFLR</div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">UNLOCKED WFLR</div>
            <div className="text-terminal-green text-sm font-bold">{unlockedBalance.toFixed(6)}</div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">LOCKED WFLR</div>
            <div className="text-terminal-amber text-sm font-bold">{lockedBalance.toFixed(6)}</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-terminal-amber text-[10px] font-bold">RNat PROJECTS // MONTH {currentMonth}</div>
          {projects.map((project) => (
            <div key={project.id} className="bg-terminal-panel border border-terminal-border p-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-terminal-white">#{project.id} {project.name}</span>
                <span className={project.claimingDisabled ? "text-terminal-red" : "text-terminal-green"}>
                  {project.claimingDisabled ? "CLAIMING DISABLED" : `${project.claimableRewards.toFixed(6)} WFLR`}
                </span>
              </div>
            </div>
          ))}
          {projects.length === 0 && <div className="text-terminal-white-dim text-[10px]">NO RNat PROJECTS FOUND</div>}
        </div>

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}
        {lastTxHash && (
          <a href={`https://coston2-explorer.flare.network/tx/${lastTxHash}`} target="_blank" rel="noopener noreferrer" className="text-terminal-green text-[10px] hover:underline block">
            ✓ TRANSACTION CONFIRMED — VIEW TX ↗
          </a>
        )}

        <button className="atm-button w-full text-[10px] border-terminal-green text-terminal-green" disabled={busy || totalClaimable === 0} onClick={claimRewards}>
          {busy ? "PROCESSING..." : "[ CLAIM PROJECT REWARDS ]"}
        </button>

        <div className="space-y-2">
          <div className="text-terminal-amber text-[10px] font-bold">WITHDRAW UNLOCKED WFLR</div>
          <div className="flex gap-2">
            <input type="number" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="0.0" className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber" />
            <button className="atm-button text-[10px]" disabled={busy || !withdrawAmount || Number(withdrawAmount) > unlockedBalance} onClick={() => withdraw(withdrawAmount).then(() => setWithdrawAmount(""))}>WITHDRAW</button>
          </div>
        </div>

        <button className="atm-button w-full text-[10px] border-terminal-red text-terminal-red" disabled={busy || wNatBalance === 0} onClick={withdrawAll}>
          [ WITHDRAW ALL — LOCKED BALANCE INCURS 50% PENALTY ]
        </button>

        <div className="text-[8px] text-terminal-white-dim border-t border-terminal-border pt-2">
          RNat: {rnatAddress || "NOT FOUND"}<br />
          Account: {rNatAccount || "NOT CREATED"}
        </div>
      </div>
    </div>
  );
}
