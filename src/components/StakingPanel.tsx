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
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const { stakedAmount, rewardAmount, rewardRate, totalStaked, busy, error, stake, unstake, claimReward, rnatAddress } = staking;

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>rFLR STAKING</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header"><span>rFLR STAKING // RNat PROTOCOL</span></div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-3">
        <div className="text-terminal-white-dim text-[10px]">
          Stake FLR via the RNat contract to receive rFLR yield rewards.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">STAKED</div>
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold"><TokenLogo symbol="rFLR" size={18} />{stakedAmount.toFixed(4)} rFLR</div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">REWARDS</div>
            <div className="flex items-center gap-2 text-terminal-green text-sm font-bold glow-green"><TokenLogo symbol="FLR" size={18} />{rewardAmount.toFixed(6)} FLR</div>
          </div>
        </div>

        <div className="bg-terminal-panel border border-terminal-border p-2">
          <div className="grid grid-cols-2 text-[10px]">
            <div><span className="text-terminal-white-dim">REWARD RATE: </span><span className="text-terminal-green">{rewardRate.toFixed(4)} FLR/block</span></div>
            <div><span className="text-terminal-white-dim">TOTAL STAKED: </span><span className="text-terminal-amber">{totalStaked.toFixed(0)} FLR</span></div>
          </div>
        </div>

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}

        <div className="space-y-2">
          <div className="text-terminal-amber text-[10px] font-bold">STAKE FLR → rFLR</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
            />
            <button
              className="atm-button text-[10px]"
              disabled={busy || !stakeAmount}
              onClick={() => stake(stakeAmount).then(() => setStakeAmount(""))}
            >STAKE</button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-terminal-amber text-[10px] font-bold">UNSTAKE rFLR → FLR</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
            />
            <button
              className="atm-button text-[10px] border-terminal-red text-terminal-red"
              disabled={busy || !unstakeAmount}
              onClick={() => unstake(unstakeAmount).then(() => setUnstakeAmount(""))}
            >UNSTAKE</button>
          </div>
        </div>

        <button
          className="atm-button w-full text-[10px] border-terminal-green text-terminal-green glow-green"
          disabled={busy || rewardAmount === 0}
          onClick={claimReward}
        >
          {busy ? "PROCESSING..." : "[ CLAIM REWARDS ]"}
        </button>

        <div className="text-[8px] text-terminal-white-dim border-t border-terminal-border pt-2">
          RNat: {rnatAddress ? `${rnatAddress.slice(0, 10)}...${rnatAddress.slice(-6)}` : "NOT FOUND"}
        </div>
      </div>
    </div>
  );
}
