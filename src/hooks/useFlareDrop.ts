"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { resolveFlareContract } from "@/lib/contracts";

const DISTRIBUTION_TO_DELEGATORS_ABI = [
  "function getClaimableAmountOf(address account, uint256 month) view returns (uint256 amount)",
  "function getClaimableMonths() view returns (uint256 startMonth, uint256 endMonth)",
  "function getCurrentMonth() view returns (uint256)",
  "function claim(address rewardOwner, address recipient, uint256 month, bool wrap) returns (uint256)",
  "function totalClaimedWei() view returns (uint256)",
];

export function useFlareDrop(
  signer: ethers.JsonRpcSigner | null,
  address: string | null
) {
  const [claimableAmount, setClaimableAmount] = useState(0);
  const [claimableMonths, setClaimableMonths] = useState<number[]>([]);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    try {
      const distAddr = await resolveFlareContract("DistributionToDelegators", provider);
      if (!distAddr || distAddr === ethers.ZeroAddress) {
        setClaimableAmount(0);
        setClaimableMonths([]);
        return;
      }
      const contract = new ethers.Contract(distAddr, DISTRIBUTION_TO_DELEGATORS_ABI, provider);
      const [startMonth, endMonth] = await contract.getClaimableMonths();
      const months: number[] = [];
      let total = 0;
      for (let i = Number(startMonth); i <= Number(endMonth); i++) {
        try {
          const amount = await contract.getClaimableAmountOf(address, i);
          if (amount > 0) {
            months.push(i);
            total += Number(ethers.formatEther(amount));
          }
        } catch {
          continue;
        }
      }
      setClaimableMonths(months);
      setClaimableAmount(total);
      try {
        const totalClaimedWei = await contract.totalClaimedWei();
        setTotalClaimed(Number(ethers.formatEther(totalClaimedWei)));
      } catch {}
    } catch {
      setClaimableAmount(0);
      setClaimableMonths([]);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const claim = useCallback(async () => {
    if (!signer || !address) {
      setError("Wallet not connected");
      return;
    }
    if (claimableMonths.length === 0) {
      setError("No claimable months");
      return;
    }
    setBusy(true);
    setError(null);
    setLastTxHash(null);
    try {
      const network = FLARE_NETWORKS[DEFAULT_NETWORK];
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const distAddr = await resolveFlareContract("DistributionToDelegators", provider);
      if (!distAddr || distAddr === ethers.ZeroAddress) {
        setError("DistributionToDelegators contract not found");
        return;
      }
      const contract = new ethers.Contract(distAddr, DISTRIBUTION_TO_DELEGATORS_ABI, signer);
      // Claim each claimable month individually
      let lastHash: string | null = null;
      for (const month of claimableMonths) {
        const tx = await contract.claim(
          address,
          address,
          month,
          true // wrap to WFLR
        );
        await tx.wait();
        lastHash = tx.hash;
      }
      setLastTxHash(lastHash);
      setClaimableAmount(0);
      setClaimableMonths([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }, [signer, address, claimableMonths, refresh]);

  return { claimableAmount, claimableMonths, totalClaimed, busy, error, claim, refresh, lastTxHash };
}
