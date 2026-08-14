"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { resolveFlareContract } from "@/lib/contracts";

const RNAT_ABI = [
  "function getBalancesOf(address owner) view returns (uint256 wNatBalance, uint256 rNatBalance, uint256 lockedBalance)",
  "function getProjectsBasicInfo() view returns (string[] names, bool[] claimingDisabled)",
  "function getClaimableRewards(uint256 projectId, address owner) view returns (uint128)",
  "function getCurrentMonth() view returns (uint256)",
  "function getRNatAccount(address owner) view returns (address)",
  "function claimRewards(uint256[] projectIds, uint256 month) returns (uint128)",
  "function withdraw(uint128 amount, bool wrap)",
  "function withdrawAll(bool wrap)",
];

export interface RNatProject {
  id: number;
  name: string;
  claimingDisabled: boolean;
  claimableRewards: number;
}

export function useStaking(signer: ethers.JsonRpcSigner | null, address: string | null) {
  const [wNatBalance, setWNatBalance] = useState(0);
  const [rNatBalance, setRNatBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [projects, setProjects] = useState<RNatProject[]>([]);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [rNatAccount, setRNatAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [rnatAddress, setRnatAddress] = useState("");

  const refresh = useCallback(async () => {
    if (!address) return;
    setError(null);
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    try {
      const contractAddress = await resolveFlareContract("RNat", provider);
      if (!contractAddress || contractAddress === ethers.ZeroAddress) return;
      setRnatAddress(contractAddress);
      const rnat = new ethers.Contract(contractAddress, RNAT_ABI, provider);
      const [[names, disabled], month] = await Promise.all([
        rnat.getProjectsBasicInfo(),
        rnat.getCurrentMonth(),
      ]);
      setCurrentMonth(Number(month));
      try {
        const [wNat, rNat, locked] = await rnat.getBalancesOf(address);
        setWNatBalance(Number(ethers.formatEther(wNat)));
        setRNatBalance(Number(ethers.formatEther(rNat)));
        setLockedBalance(Number(ethers.formatEther(locked)));
        setRNatAccount(await rnat.getRNatAccount(address));
      } catch {
        setWNatBalance(0);
        setRNatBalance(0);
        setLockedBalance(0);
        setRNatAccount("");
      }
      const projectRows = await Promise.all(names.map(async (name: string, id: number) => {
        let claimableRewards = 0;
        try {
          claimableRewards = Number(ethers.formatEther(await rnat.getClaimableRewards(id, address)));
        } catch {}
        return {
          id,
          name,
          claimingDisabled: Boolean(disabled[id]),
          claimableRewards,
        };
      }));
      setProjects(projectRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read RNat state");
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(async (action: (rnat: ethers.Contract) => Promise<any>) => {
    if (!signer || !rnatAddress) {
      setError("Wallet not connected or RNat contract not found");
      return;
    }
    setBusy(true);
    setError(null);
    setLastTxHash(null);
    try {
      const rnat = new ethers.Contract(rnatAddress, RNAT_ABI, signer);
      const tx = await action(rnat);
      await tx.wait();
      setLastTxHash(tx.hash);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "RNat transaction failed");
    } finally {
      setBusy(false);
    }
  }, [signer, rnatAddress, refresh]);

  const claimRewards = useCallback(async () => {
    const projectIds = projects.filter((project) => !project.claimingDisabled && project.claimableRewards > 0).map((project) => project.id);
    if (projectIds.length === 0) {
      setError("No claimable RNat project rewards");
      return;
    }
    await submit((rnat) => rnat.claimRewards(projectIds, currentMonth));
  }, [projects, currentMonth, submit]);

  const withdraw = useCallback(async (amount: string) => {
    await submit((rnat) => rnat.withdraw(ethers.parseEther(amount), true));
  }, [submit]);

  const withdrawAll = useCallback(async () => {
    await submit((rnat) => rnat.withdrawAll(true));
  }, [submit]);

  const totalClaimable = projects.reduce((sum, project) => sum + project.claimableRewards, 0);
  const unlockedBalance = Math.max(0, wNatBalance - lockedBalance);

  return {
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
  };
}
