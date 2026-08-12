"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { resolveFlareContract } from "@/lib/contracts";

const RNAT_ABI = [
  "function stake() payable",
  "function unstake(uint256 amount)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function getCurrentRewardRate() view returns (uint256)",
  "function getStakedAmount(address) view returns (uint256)",
  "function getRewardAmount(address) view returns (uint256)",
  "function claimReward()",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

export function useStaking(
  signer: ethers.JsonRpcSigner | null,
  address: string | null
) {
  const [stakedAmount, setStakedAmount] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardRate, setRewardRate] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rnatAddress, setRnatAddress] = useState("");

  const refresh = useCallback(async () => {
    if (!address) return;
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    try {
      const rnatAddr = await resolveFlareContract("RNat", provider);
      if (!rnatAddr) return;
      setRnatAddress(rnatAddr);
      const rnat = new ethers.Contract(rnatAddr, RNAT_ABI, provider);
      const staked = await rnat.getStakedAmount(address);
      setStakedAmount(Number(ethers.formatEther(staked)));
      const reward = await rnat.getRewardAmount(address);
      setRewardAmount(Number(ethers.formatEther(reward)));
      try {
        const rate = await rnat.getCurrentRewardRate();
        setRewardRate(Number(ethers.formatEther(rate)));
      } catch {}
      try {
        const total = await rnat.totalSupply();
        setTotalStaked(Number(ethers.formatEther(total)));
      } catch {}
    } catch {
      setStakedAmount(0);
      setRewardAmount(0);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stake = useCallback(
    async (amount: string) => {
      if (!signer || !rnatAddress) {
        setError("Wallet not connected or RNat contract not found");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const rnat = new ethers.Contract(rnatAddress, RNAT_ABI, signer);
        const tx = await rnat.stake({ value: ethers.parseEther(amount) });
        await tx.wait();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Stake failed");
      } finally {
        setBusy(false);
      }
    },
    [signer, rnatAddress, refresh]
  );

  const unstake = useCallback(
    async (amount: string) => {
      if (!signer || !rnatAddress) {
        setError("Wallet not connected or RNat contract not found");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const rnat = new ethers.Contract(rnatAddress, RNAT_ABI, signer);
        const tx = await rnat.unstake(ethers.parseEther(amount));
        await tx.wait();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unstake failed");
      } finally {
        setBusy(false);
      }
    },
    [signer, rnatAddress, refresh]
  );

  const claimReward = useCallback(async () => {
    if (!signer || !rnatAddress) {
      setError("Wallet not connected or RNat contract not found");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rnat = new ethers.Contract(rnatAddress, RNAT_ABI, signer);
      const tx = await rnat.claimReward();
      await tx.wait();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }, [signer, rnatAddress, refresh]);

  return {
    stakedAmount,
    rewardAmount,
    rewardRate,
    totalStaked,
    busy,
    error,
    rnatAddress,
    stake,
    unstake,
    claimReward,
    refresh,
  };
}
