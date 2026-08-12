"use client";

import { useState } from "react";
import { ethers } from "ethers";
import type { useDelegation } from "@/hooks/useDelegation";
import { FTSO_SYMBOLS } from "@/lib/flare";
import { TokenLogo } from "./TokenLogo";

interface DelegationPanelProps {
  isConnected: boolean;
  address: string | null;
  delegation: ReturnType<typeof useDelegation>;
  onConnect: () => void;
}

export function DelegationPanel({
  isConnected,
  address,
  delegation,
  onConnect,
}: DelegationPanelProps) {
  const [wrapAmount, setWrapAmount] = useState("");
  const [unwrapAmount, setUnwrapAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [delegateBips, setDelegateBips] = useState("100");
  const [provider2, setProvider2] = useState("");
  const [bips2, setBips2] = useState("0");
  const [showProviders, setShowProviders] = useState(false);
  const [executorAddr, setExecutorAddr] = useState("");
  const [showAutoClaim, setShowAutoClaim] = useState(false);

  const {
    wflrBalance,
    nativeBalance,
    delegations,
    dataProviders,
    claimableReward,
    rewardEpochs,
    loading,
    error,
    txPending,
    wnatAddress,
    autoClaimEnabled,
    claimExecutors,
    wrapFLR,
    unwrapFLR,
    delegate,
    batchDelegate,
    undelegateAll,
    claimRewards,
    setupAutoClaim,
    removeAutoClaim,
    refresh,
  } = delegation;

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header">
          <span>DELEGATION // FTSO REWARDS</span>
        </div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-terminal-white-dim text-xs">WALLET NOT CONNECTED</div>
            <button className="atm-button" onClick={onConnect}>
              [ CONNECT WALLET ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDelegate = () => {
    if (!selectedProvider) return;
    if (provider2 && bips2 !== "0") {
      const total = parseInt(delegateBips) + parseInt(bips2);
      if (total > 10000) return;
      batchDelegate(
        [selectedProvider, provider2],
        [parseInt(delegateBips), parseInt(bips2)]
      );
    } else {
      delegate(selectedProvider, parseInt(delegateBips));
    }
  };

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>DELEGATION // FTSO REWARDS</span>
        <button
          className="text-[10px] text-terminal-white-dim hover:text-terminal-amber"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "LOADING..." : "[REFRESH]"}
        </button>
      </div>

      {error && (
        <div className="bg-terminal-red/10 border-b border-terminal-red/30 px-2 py-1 text-[10px] text-terminal-red">
          ERROR: {error}
        </div>
      )}

      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs">
        {/* Balances */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">NATIVE FLR</div>
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold">
              <TokenLogo symbol="FLR" size={18} />
              {nativeBalance.toFixed(4)}
            </div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">WRAPPED WFLR</div>
            <div className="flex items-center gap-2 text-terminal-green text-sm font-bold glow-green">
              <TokenLogo symbol="WFLR" size={18} />
              {wflrBalance.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Wrap / Unwrap */}
        <div className="space-y-2">
          <div className="text-terminal-amber text-[10px] font-bold">WRAP FLR → WFLR</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={wrapAmount}
              onChange={(e) => setWrapAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-xs focus:outline-none focus:border-terminal-amber"
            />
            <button
              className="atm-button text-[10px]"
              disabled={txPending || !wrapAmount}
              onClick={() => wrapFLR(wrapAmount).then(() => setWrapAmount(""))}
            >
              WRAP
            </button>
          </div>

          <div className="text-terminal-amber text-[10px] font-bold">UNWRAP WFLR → FLR</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={unwrapAmount}
              onChange={(e) => setUnwrapAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-xs focus:outline-none focus:border-terminal-amber"
            />
            <button
              className="atm-button text-[10px]"
              disabled={txPending || !unwrapAmount}
              onClick={() => unwrapFLR(unwrapAmount).then(() => setUnwrapAmount(""))}
            >
              UNWRAP
            </button>
          </div>
        </div>

        {/* Current Delegations */}
        <div>
          <div className="text-terminal-amber text-[10px] font-bold mb-1">ACTIVE DELEGATIONS</div>
          {delegations.length === 0 ? (
            <div className="text-terminal-white-dim text-[10px]">NO ACTIVE DELEGATIONS</div>
          ) : (
            <div className="space-y-1">
              {delegations.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-terminal-panel border border-terminal-border px-2 py-1"
                >
                  <span className="text-terminal-white text-[10px] font-mono">
                    {d.delegatee.slice(0, 10)}...{d.delegatee.slice(-6)}
                  </span>
                  <span className="text-terminal-green text-[10px]">
                    {(d.bips / 100).toFixed(0)}% ({Number(ethers.formatEther(d.amount)).toFixed(2)} WFLR)
                  </span>
                </div>
              ))}
              <button
                className="atm-button w-full text-[10px] mt-1 border-terminal-red text-terminal-red"
                disabled={txPending}
                onClick={undelegateAll}
              >
                [ UNDELEGATE ALL ]
              </button>
            </div>
          )}
        </div>

        {/* Delegate to Provider */}
        <div className="space-y-2">
          <div className="text-terminal-amber text-[10px] font-bold">DELEGATE TO FTSO PROVIDER</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              placeholder="Provider address or select from list"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-terminal-amber"
            />
            <button
              className="text-[10px] text-terminal-white-dim hover:text-terminal-amber border border-terminal-border px-2"
              onClick={() => setShowProviders(!showProviders)}
            >
              {showProviders ? "HIDE" : "LIST"}
            </button>
          </div>

          {showProviders && (
            <div className="max-h-32 overflow-y-auto border border-terminal-border bg-terminal-panel">
              {dataProviders.length === 0 ? (
                <div className="text-terminal-white-dim text-[10px] p-2">NO PROVIDERS LOADED</div>
              ) : (
                dataProviders.map((p) => (
                  <button
                    key={p.address}
                    className="w-full flex justify-between items-center px-2 py-1 text-[10px] hover:bg-terminal-amber/10 border-b border-terminal-border/50"
                    onClick={() => {
                      setSelectedProvider(p.address);
                      setShowProviders(false);
                    }}
                  >
                    <span className="text-terminal-white">
                      {p.name || p.symbol || p.address.slice(0, 10) + "..."}
                    </span>
                    <span className={`text-[8px] ${p.active ? "text-terminal-green" : "text-terminal-red"}`}>
                      {p.active ? "ACTIVE" : "INACTIVE"} | {Number(ethers.formatEther(p.votePower)).toFixed(0)} VP
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <div className="text-terminal-white-dim text-[8px]">BIPS (10000 = 100%)</div>
              <input
                type="number"
                value={delegateBips}
                onChange={(e) => setDelegateBips(e.target.value)}
                className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
              />
            </div>
            <div className="flex-1">
              <div className="text-terminal-white-dim text-[8px]">PROVIDER 2 (OPTIONAL)</div>
              <input
                type="text"
                value={provider2}
                onChange={(e) => setProvider2(e.target.value)}
                placeholder="0x..."
                className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-terminal-amber"
              />
            </div>
            <div className="w-16">
              <div className="text-terminal-white-dim text-[8px]">BIPS 2</div>
              <input
                type="number"
                value={bips2}
                onChange={(e) => setBips2(e.target.value)}
                className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
              />
            </div>
          </div>

          <button
            className="atm-button w-full text-[10px]"
            disabled={txPending || !selectedProvider}
            onClick={handleDelegate}
          >
            [ DELEGATE ]
          </button>
        </div>

        {/* Rewards */}
        <div className="space-y-2 border-t border-terminal-border pt-2">
          <div className="text-terminal-amber text-[10px] font-bold">FTSO REWARDS</div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="flex justify-between">
              <span className="text-terminal-white-dim text-[10px]">CLAIMABLE</span>
              <span className="flex items-center gap-2 text-terminal-green text-sm font-bold glow-green">
                <TokenLogo symbol="FLR" size={18} />
                {claimableReward.toFixed(6)} FLR
              </span>
            </div>
            {rewardEpochs.length > 0 && (
              <div className="text-terminal-white-dim text-[8px] mt-1">
                {rewardEpochs.length} EPOCH(S) WITH REWARDS
              </div>
            )}
          </div>
          <button
            className="atm-button w-full text-[10px] border-terminal-green text-terminal-green glow-green"
            disabled={txPending || claimableReward === 0}
            onClick={claimRewards}
          >
            {txPending ? "PROCESSING..." : "[ CLAIM & WRAP REWARDS ]"}
          </button>
        </div>

        {/* Auto-Claiming */}
        <div className="space-y-2 border-t border-terminal-border pt-2">
          <div className="text-terminal-amber text-[10px] font-bold">AUTO-CLAIMING</div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="flex justify-between items-center">
              <span className="text-terminal-white-dim text-[10px]">STATUS</span>
              <span className={`text-[10px] ${autoClaimEnabled ? "text-terminal-green glow-green" : "text-terminal-white-dim"}`}>
                {autoClaimEnabled ? "● ENABLED" : "○ DISABLED"}
              </span>
            </div>
            {autoClaimEnabled && claimExecutors.length > 0 && (
              <div className="text-terminal-white-dim text-[8px] mt-1">
                EXECUTOR: {claimExecutors[0].slice(0, 10)}...{claimExecutors[0].slice(-6)}
              </div>
            )}
          </div>

          {showAutoClaim ? (
            <div className="space-y-2">
              <div className="text-terminal-white-dim text-[10px]">
                Set a claim executor to automatically claim rewards on your behalf each epoch.
              </div>
              <div>
                <div className="text-terminal-amber text-[10px] font-bold mb-1">EXECUTOR ADDRESS</div>
                <input
                  type="text"
                  value={executorAddr}
                  onChange={(e) => setExecutorAddr(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-terminal-amber"
                />
              </div>
              <button
                className="atm-button w-full text-[10px] border-terminal-green text-terminal-green"
                disabled={txPending || !executorAddr}
                onClick={() => {
                  setupAutoClaim(executorAddr, 0).then(() => {
                    setShowAutoClaim(false);
                    setExecutorAddr("");
                  });
                }}
              >
                {txPending ? "PROCESSING..." : "[ SET EXECUTOR ]"}
              </button>
              <button
                className="atm-button w-full text-[10px]"
                onClick={() => setShowAutoClaim(false)}
              >
                [ CANCEL ]
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {!autoClaimEnabled ? (
                <button
                  className="atm-button flex-1 text-[10px]"
                  onClick={() => setShowAutoClaim(true)}
                >
                  [ SETUP AUTO-CLAIM ]
                </button>
              ) : (
                <button
                  className="atm-button flex-1 text-[10px] border-terminal-red text-terminal-red"
                  disabled={txPending}
                  onClick={removeAutoClaim}
                >
                  {txPending ? "..." : "[ DISABLE ]"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contract Info */}
        <div className="text-[8px] text-terminal-white-dim border-t border-terminal-border pt-2">
          WNat: {wnatAddress ? `${wnatAddress.slice(0, 10)}...${wnatAddress.slice(-6)}` : "NOT FOUND"}
        </div>
      </div>
    </div>
  );
}
