"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { resolveFlareContract } from "@/lib/contracts";

const FTSO_MANAGER_ABI_V2 = [
  "function getCurrentRewardEpochId() view returns (uint256)",
  "function getRewardEpochDurationSeconds() view returns (uint256)",
  "function getCurrentVotingEpochId() view returns (uint256)",
  "function getVotingEpochDurationSeconds() view returns (uint256)",
  "function getDataProviderCount() view returns (uint256)",
  "function getDataProviderAt(uint256 index) view returns (address)",
  "function getDataProviderInfo(address) view returns (string name, string symbol, uint256 votePower, bool active)",
];

export interface EpochInfo {
  currentRewardEpoch: number;
  rewardEpochDuration: number;
  currentVotingEpoch: number;
  votingEpochDuration: number;
  dataProviderCount: number;
}

export interface DataProviderStats {
  address: string;
  name: string;
  symbol: string;
  votePower: bigint;
  active: boolean;
}

export function useEpochs() {
  const [epochInfo, setEpochInfo] = useState<EpochInfo | null>(null);
  const [providers, setProviders] = useState<DataProviderStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    setLoading(true);
    setError(null);
    try {
      const ftsoMgrAddr = await resolveFlareContract("FtsoManager", provider);
      if (!ftsoMgrAddr) {
        setError("FtsoManager not found in registry");
        return;
      }
      const ftsoMgr = new ethers.Contract(ftsoMgrAddr, FTSO_MANAGER_ABI_V2, provider);

      const [rewardEpoch, rewardDuration, votingEpoch, votingDuration, dpCount] =
        await Promise.all([
          ftsoMgr.getCurrentRewardEpochId(),
          ftsoMgr.getRewardEpochDurationSeconds(),
          ftsoMgr.getCurrentVotingEpochId(),
          ftsoMgr.getVotingEpochDurationSeconds(),
          ftsoMgr.getDataProviderCount(),
        ]);

      setEpochInfo({
        currentRewardEpoch: Number(rewardEpoch),
        rewardEpochDuration: Number(rewardDuration),
        currentVotingEpoch: Number(votingEpoch),
        votingEpochDuration: Number(votingDuration),
        dataProviderCount: Number(dpCount),
      });

      const maxProviders = Math.min(Number(dpCount), 30);
      const dps: DataProviderStats[] = [];
      for (let i = 0; i < maxProviders; i++) {
        try {
          const dpAddress = await ftsoMgr.getDataProviderAt(i);
          const info = await ftsoMgr.getDataProviderInfo(dpAddress);
          dps.push({
            address: dpAddress,
            name: info[0],
            symbol: info[1],
            votePower: info[2],
            active: info[3],
          });
        } catch {
          continue;
        }
      }
      setProviders(dps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load epoch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { epochInfo, providers, loading, error, refresh };
}
