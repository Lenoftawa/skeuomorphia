"use client";

import type { useGovernance } from "@/hooks/useGovernance";
import { TokenLogo } from "./TokenLogo";

interface GovernancePanelProps {
  isConnected: boolean;
  governance: ReturnType<typeof useGovernance>;
  onConnect: () => void;
}

export function GovernancePanel({ isConnected, governance, onConnect }: GovernancePanelProps) {
  const { votingPower, delegatedPower, delegatees, totalSupply, wnatAddress, error, refresh } = governance;

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

  const pctOfSupply = totalSupply > 0 ? (votingPower / totalSupply) * 100 : 0;

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>GOVERNANCE // WFLR VOTING POWER</span>
        <button className="text-[10px] text-terminal-white-dim hover:text-terminal-amber" onClick={refresh}>[REFRESH]</button>
      </div>
      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs p-2">
        <div className="text-terminal-white-dim text-[10px]">
          Your WFLR balance determines your voting power in Flare governance.
          Delegate to FTSO data providers to participate in consensus and earn rewards.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">VOTING POWER</div>
            <div className="flex items-center gap-2 text-terminal-amber text-sm font-bold">
              <TokenLogo symbol="WFLR" size={18} />{votingPower.toFixed(2)} WFLR
            </div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-2">
            <div className="text-terminal-white-dim text-[10px]">DELEGATED</div>
            <div className="flex items-center gap-2 text-terminal-green text-sm font-bold">
              <TokenLogo symbol="WFLR" size={18} />{delegatedPower.toFixed(2)} WFLR
            </div>
          </div>
        </div>

        <div className="bg-terminal-panel border border-terminal-border p-2 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-terminal-white-dim">% OF TOTAL SUPPLY</span>
            <span className="text-terminal-white">{pctOfSupply.toFixed(6)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-white-dim">TOTAL WFLR SUPPLY</span>
            <span className="text-terminal-white">{totalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {delegatees.length > 0 && (
          <div className="space-y-1">
            <div className="text-terminal-amber text-[10px] font-bold">ACTIVE DELEGATIONS</div>
            {delegatees.map((d, i) => (
              <div key={i} className="bg-terminal-panel border border-terminal-border p-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-terminal-cyan">{d.address.slice(0, 10)}...{d.address.slice(-6)}</span>
                  <span className="text-terminal-green">{(d.bips / 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {delegatees.length === 0 && votingPower > 0 && (
          <div className="border border-terminal-amber/40 bg-terminal-amber/10 p-2 text-[10px] text-terminal-amber">
            You have WFLR but no active delegations. Use the Delegation panel (F7) to delegate to FTSO data providers.
          </div>
        )}

        {error && <div className="text-terminal-red text-[10px] glow-red">ERROR: {error}</div>}

        <div className="border-t border-terminal-border pt-2 text-[8px] text-terminal-white-dim">
          WNat: {wnatAddress ? `${wnatAddress.slice(0, 10)}...${wnatAddress.slice(-6)}` : "NOT FOUND"}<br />
          Flare governance proposals are managed off-chain via the Flare Improvement Proposal process.
          Visit <a href="https://proposals.flare.network" target="_blank" rel="noopener noreferrer" className="text-terminal-cyan hover:underline">proposals.flare.network</a> for active proposals.
        </div>
      </div>
    </div>
  );
}
