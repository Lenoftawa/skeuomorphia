"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { resolveFlareContract } from "@/lib/contracts";

const DISTRIBUTION_TO_DELEGATORS_ABI = [
  "function getClaimableAmounts(address beneficiary, uint256[] monthIndices) view returns (uint256[] amounts, bool[] claimed)",
  "function getClaimableAmount(address beneficiary, uint256 monthIndex) view returns (uint256 amount, bool claimed)",
  "function claim(address beneficiary, uint256 monthIndex, uint256 amount, bytes32[] merkleProof)",
  "function getDistributionIndex() view returns (uint256)",
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

  const refresh = useCallback(async () => {
    if (!address) return;
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    try {
      const distAddr = await resolveFlareContract("DistributionToDelegators", provider);
      if (!distAddr) {
        setClaimableAmount(0);
        return;
      }
      const contract = new ethers.Contract(distAddr, DISTRIBUTION_TO_DELEGATORS_ABI, provider);
      const currentMonth = await contract.getDistributionIndex();
      const months: number[] = [];
      let total = 0;
      for (let i = 0; i < Number(currentMonth); i++) {
        try {
          const [amount, claimed] = await contract.getClaimableAmount(address, i);
          if (!claimed && amount > 0) {
            months.push(i);
            total += Number(ethers.formatEther(amount));
          }
        } catch {
          continue;
        }
      }
      setClaimableMonths(months);
      setClaimableAmount(total);
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
    setBusy(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setTotalClaimed((prev) => prev + claimableAmount);
      setClaimableAmount(0);
      setClaimableMonths([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }, [signer, address, claimableAmount]);

  return { claimableAmount, claimableMonths, totalClaimed, busy, error, claim, refresh };
}
