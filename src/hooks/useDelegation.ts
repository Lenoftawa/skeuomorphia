"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import {
  getWNatContract,
  getFtsoManagerContract,
  getFtsoRewardManagerContract,
  getClaimSetupManagerContract,
  resolveFlareContract,
  DEPLOYED_ADDRESSES,
} from "@/lib/contracts";

export interface DataProvider {
  address: string;
  name: string;
  symbol: string;
  votePower: bigint;
  active: boolean;
}

export interface DelegationInfo {
  delegatee: string;
  bips: number;
  amount: bigint;
}

export interface RewardEpochInfo {
  epochId: number;
  amounts: bigint[];
  claimed: boolean[];
}

export function useDelegation(
  signer: ethers.JsonRpcSigner | null,
  address: string | null
) {
  const [wflrBalance, setWflrBalance] = useState(0);
  const [nativeBalance, setNativeBalance] = useState(0);
  const [delegations, setDelegations] = useState<DelegationInfo[]>([]);
  const [dataProviders, setDataProviders] = useState<DataProvider[]>([]);
  const [claimableReward, setClaimableReward] = useState(0);
  const [rewardEpochs, setRewardEpochs] = useState<RewardEpochInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txPending, setTxPending] = useState(false);
  const [wnatAddress, setWnatAddress] = useState("");
  const [ftsoManagerAddress, setFtsoManagerAddress] = useState("");
  const [ftsoRewardManagerAddress, setFtsoRewardManagerAddress] = useState("");

  const [claimSetupManagerAddress, setClaimSetupManagerAddress] = useState("");
  const [autoClaimEnabled, setAutoClaimEnabled] = useState(false);
  const [claimExecutors, setClaimExecutors] = useState<string[]>([]);

  const network = FLARE_NETWORKS[DEFAULT_NETWORK];

  const refresh = useCallback(async () => {
    if (!address) return;
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    try {
      setLoading(true);
      setError(null);

      const wnatAddr = wnatAddress || await resolveFlareContract("WNat", provider);
      const ftsoMgrAddr = ftsoManagerAddress || await resolveFlareContract("FtsoManager", provider);
      const rewardMgrAddr = ftsoRewardManagerAddress || await resolveFlareContract("FtsoRewardManager", provider);
      const claimSetupAddr = claimSetupManagerAddress || await resolveFlareContract("ClaimSetupManager", provider);

      if (wnatAddr) setWnatAddress(wnatAddr);
      if (ftsoMgrAddr) setFtsoManagerAddress(ftsoMgrAddr);
      if (rewardMgrAddr) setFtsoRewardManagerAddress(rewardMgrAddr);
      if (claimSetupAddr) {
        setClaimSetupManagerAddress(claimSetupAddr);
        try {
          const claimSetup = getClaimSetupManagerContract(provider, claimSetupAddr);
          const executors = await claimSetup.getClaimExecutors(address);
          setClaimExecutors(executors);
          setAutoClaimEnabled(executors.length > 0);
        } catch {
          setClaimExecutors([]);
          setAutoClaimEnabled(false);
        }
      }

      if (wnatAddr) {
        const wnat = getWNatContract(provider, wnatAddr);
        const bal = await wnat.balanceOf(address);
        setWflrBalance(Number(ethers.formatEther(bal)));

        try {
          const [delegatees, bips, amounts] = await wnat.delegatesOf(address);
          const delegs: DelegationInfo[] = [];
          for (let i = 0; i < delegatees.length; i++) {
            delegs.push({
              delegatee: delegatees[i],
              bips: Number(bips[i]),
              amount: amounts[i],
            });
          }
          setDelegations(delegs);
        } catch {
          setDelegations([]);
        }
      }

      const nativeBal = await provider.getBalance(address);
      setNativeBalance(Number(ethers.formatEther(nativeBal)));

      if (ftsoMgrAddr) {
        try {
          const ftsoMgr = getFtsoManagerContract(provider, ftsoMgrAddr);
          const count = await ftsoMgr.getDataProviderCount();
          const providers: DataProvider[] = [];
          const maxProviders = Math.min(Number(count), 20);
          for (let i = 0; i < maxProviders; i++) {
            try {
              const dpAddress = await ftsoMgr.getDataProviderAt(i);
              const info = await ftsoMgr.getDataProviderInfo(dpAddress);
              providers.push({
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
          setDataProviders(providers);
        } catch {
          setDataProviders([]);
        }
      }

      if (rewardMgrAddr) {
        try {
          const rewardMgr = getFtsoRewardManagerContract(provider, rewardMgrAddr);
          const epochs = await rewardMgr.getEpochsWithClaimableRewards(address);
          if (epochs.length > 0) {
            const [amounts, claimed] = await rewardMgr.getClaimableRewardAmounts(address, epochs);
            const epochInfos: RewardEpochInfo[] = [];
            let totalClaimable = 0;
            for (let i = 0; i < epochs.length; i++) {
              const amt = Number(ethers.formatEther(amounts[i]));
              if (!claimed[i] && amt > 0) {
                totalClaimable += amt;
              }
              epochInfos.push({
                epochId: Number(epochs[i]),
                amounts: [amounts[i]],
                claimed: [claimed[i]],
              });
            }
            setRewardEpochs(epochInfos);
            setClaimableReward(totalClaimable);
          } else {
            setRewardEpochs([]);
            setClaimableReward(0);
          }
        } catch {
          setRewardEpochs([]);
          setClaimableReward(0);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load delegation data");
    } finally {
      setLoading(false);
    }
  }, [address, network.rpcUrl, wnatAddress, ftsoManagerAddress, ftsoRewardManagerAddress, claimSetupManagerAddress]);

  useEffect(() => {
    if (address) refresh();
  }, [address, refresh]);

  const wrapFLR = useCallback(
    async (amount: string) => {
      if (!signer || !wnatAddress) {
        setError("Wallet not connected or WNat contract not found");
        return;
      }
      try {
        setTxPending(true);
        setError(null);
        const wnat = getWNatContract(signer, wnatAddress);
        const tx = await wnat.deposit({ value: ethers.parseEther(amount) });
        await tx.wait();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to wrap FLR");
      } finally {
        setTxPending(false);
      }
    },
    [signer, wnatAddress, refresh]
  );

  const unwrapFLR = useCallback(
    async (amount: string) => {
      if (!signer || !wnatAddress) {
        setError("Wallet not connected or WNat contract not found");
        return;
      }
      try {
        setTxPending(true);
        setError(null);
        const wnat = getWNatContract(signer, wnatAddress);
        const tx = await wnat.withdraw(ethers.parseEther(amount));
        await tx.wait();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to unwrap FLR");
      } finally {
        setTxPending(false);
      }
    },
    [signer, wnatAddress, refresh]
  );

  const delegate = useCallback(
    async (toAddress: string, bips: number) => {
      if (!signer || !wnatAddress) {
        setError("Wallet not connected or WNat contract not found");
        return;
      }
      try {
        setTxPending(true);
        setError(null);
        const wnat = getWNatContract(signer, wnatAddress);
        const tx = await wnat.delegate(toAddress, bips);
        await tx.wait();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delegate");
      } finally {
        setTxPending(false);
      }
    },
    [signer, wnatAddress, refresh]
  );

  const batchDelegate = useCallback(
    async (addresses: string[], bips: number[]) => {
      if (!signer || !wnatAddress) {
        setError("Wallet not connected or WNat contract not found");
        return;
      }
      try {
        setTxPending(true);
        setError(null);
        const wnat = getWNatContract(signer, wnatAddress);
        const tx = await wnat.batchDelegate(addresses, bips);
        await tx.wait();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to batch delegate");
      } finally {
        setTxPending(false);
      }
    },
    [signer, wnatAddress, refresh]
  );

  const undelegateAll = useCallback(async () => {
    if (!signer || !wnatAddress) {
      setError("Wallet not connected or WNat contract not found");
      return;
    }
    try {
      setTxPending(true);
      setError(null);
      const wnat = getWNatContract(signer, wnatAddress);
      const tx = await wnat.undelegateAll();
      await tx.wait();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to undelegate");
    } finally {
      setTxPending(false);
    }
  }, [signer, wnatAddress, refresh]);

  const claimRewards = useCallback(async () => {
    if (!signer || !ftsoRewardManagerAddress || !address) {
      setError("Wallet not connected or reward manager not found");
      return;
    }
    try {
      setTxPending(true);
      setError(null);
      const rewardMgr = getFtsoRewardManagerContract(signer, ftsoRewardManagerAddress);
      const epochs = await rewardMgr.getEpochsWithClaimableRewards(address);
      if (epochs.length === 0) {
        setError("No claimable rewards");
        return;
      }
      const tx = await rewardMgr.claimAndWrapReward(address, epochs);
      await tx.wait();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim rewards");
    } finally {
      setTxPending(false);
    }
  }, [signer, ftsoRewardManagerAddress, address, refresh]);

  const setupAutoClaim = useCallback(
    async (executorAddress: string, feeBips: number = 0) => {
      if (!signer || !claimSetupManagerAddress || !address) {
        setError("Wallet not connected or ClaimSetupManager not found");
        return;
      }
      try {
        setTxPending(true);
        setError(null);
        const claimSetup = getClaimSetupManagerContract(signer, claimSetupManagerAddress);
        const tx1 = await claimSetup.setClaimExecutors([executorAddress]);
        await tx1.wait();
        if (feeBips > 0) {
          const tx2 = await claimSetup.setClaimingForDelegate(address, executorAddress, feeBips);
          await tx2.wait();
        }
        setAutoClaimEnabled(true);
        setClaimExecutors([executorAddress]);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to setup auto-claiming");
      } finally {
        setTxPending(false);
      }
    },
    [signer, claimSetupManagerAddress, address, refresh]
  );

  const removeAutoClaim = useCallback(async () => {
    if (!signer || !claimSetupManagerAddress) {
      setError("Wallet not connected or ClaimSetupManager not found");
      return;
    }
    try {
      setTxPending(true);
      setError(null);
      const claimSetup = getClaimSetupManagerContract(signer, claimSetupManagerAddress);
      const tx = await claimSetup.setClaimExecutors([]);
      await tx.wait();
      setAutoClaimEnabled(false);
      setClaimExecutors([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove auto-claiming");
    } finally {
      setTxPending(false);
    }
  }, [signer, claimSetupManagerAddress, refresh]);

  return {
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
    claimSetupManagerAddress,
    refresh,
    wrapFLR,
    unwrapFLR,
    delegate,
    batchDelegate,
    undelegateAll,
    claimRewards,
    setupAutoClaim,
    removeAutoClaim,
  };
}
