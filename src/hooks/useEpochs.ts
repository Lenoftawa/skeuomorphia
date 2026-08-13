"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { resolveFlareContract } from "@/lib/contracts";

// FTSOv2 FtsoManager ABI — verified against Coston2 contract
// Note: FTSOv2 does not expose data provider enumeration on FtsoManager.
const FTSO_MANAGER_ABI_V2 = [
  "function getCurrentRewardEpochId() view returns (uint256)",
  "function getCurrentVotingEpochId() view returns (uint256)",
  "function rewardEpochDurationSeconds() view returns (uint256)",
  "function votingEpochDurationSeconds() view returns (uint256)",
];

export interface EpochInfo {
  currentRewardEpoch: number;
  rewardEpochDuration: number;
  currentVotingEpoch: number;
  votingEpochDuration: number;
}

export function useEpochs() {
  const [epochInfo, setEpochInfo] = useState<EpochInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    setLoading(true);
    setError(null);
    try {
      const ftsoMgrAddr = await resolveFlareContract("FtsoManager", provider);
      if (!ftsoMgrAddr || ftsoMgrAddr === ethers.ZeroAddress) {
        setError("FtsoManager not found in registry");
        return;
      }
      const ftsoMgr = new ethers.Contract(ftsoMgrAddr, FTSO_MANAGER_ABI_V2, provider);

      const [rewardEpoch, rewardDuration, votingEpoch, votingDuration] =
        await Promise.all([
          ftsoMgr.getCurrentRewardEpochId(),
          ftsoMgr.rewardEpochDurationSeconds(),
          ftsoMgr.getCurrentVotingEpochId(),
          ftsoMgr.votingEpochDurationSeconds(),
        ]);

      setEpochInfo({
        currentRewardEpoch: Number(rewardEpoch),
        rewardEpochDuration: Number(rewardDuration),
        currentVotingEpoch: Number(votingEpoch),
        votingEpochDuration: Number(votingDuration),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load epoch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { epochInfo, loading, error, refresh };
}
