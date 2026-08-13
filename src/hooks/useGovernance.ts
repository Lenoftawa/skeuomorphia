"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";
import { resolveFlareContract, getWNatContract } from "@/lib/contracts";

export interface GovernanceState {
  votingPower: number;
  delegatedPower: number;
  delegatees: { address: string; bips: number }[];
  totalSupply: number;
  wnatAddress: string;
}

export function useGovernance(
  _signer: ethers.JsonRpcSigner | null,
  address: string | null
) {
  const [state, setState] = useState<GovernanceState>({
    votingPower: 0,
    delegatedPower: 0,
    delegatees: [],
    totalSupply: 0,
    wnatAddress: "",
  });
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    try {
      const wnatAddr = await resolveFlareContract("WNat", provider);
      if (!wnatAddr || wnatAddr === ethers.ZeroAddress) return;
      const wnat = getWNatContract(provider, wnatAddr);
      const bal = await wnat.balanceOf(address);
      const totalSupply = await wnat.totalSupply();
      const votingPower = Number(ethers.formatEther(bal));
      const totalSupplyNum = Number(ethers.formatEther(totalSupply));

      let delegatees: { address: string; bips: number }[] = [];
      let delegatedPower = 0;
      try {
        const [delegateeAddrs, bips] = await wnat.delegatesOf(address);
        for (let i = 0; i < delegateeAddrs.length; i++) {
          delegatees.push({ address: delegateeAddrs[i], bips: Number(bips[i]) });
          delegatedPower += (Number(bips[i]) / 10000) * votingPower;
        }
      } catch {
        // No delegations
      }

      setState({
        votingPower,
        delegatedPower,
        delegatees,
        totalSupply: totalSupplyNum,
        wnatAddress: wnatAddr,
      });
    } catch {
      setError("Failed to read governance state");
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, error, refresh };
}
