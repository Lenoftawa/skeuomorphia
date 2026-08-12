"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK, MOCK_PROPOSALS } from "@/lib/flare";
import { resolveFlareContract, getWNatContract } from "@/lib/contracts";

export interface Proposal {
  id: string;
  title: string;
  status: "active" | "passed" | "failed";
  forVotes: number;
  againstVotes: number;
  endTime: number;
  description: string;
  voted?: "for" | "against" | null;
}

export function useGovernance(
  signer: ethers.JsonRpcSigner | null,
  address: string | null
) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votingPower, setVotingPower] = useState(0);
  const [delegatedPower, setDelegatedPower] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    setProposals(MOCK_PROPOSALS as Proposal[]);

    if (address) {
      try {
        const wnatAddr = await resolveFlareContract("WNat", provider);
        if (wnatAddr) {
          const wnat = getWNatContract(provider, wnatAddr);
          const bal = await wnat.balanceOf(address);
          setVotingPower(Number(ethers.formatEther(bal)));
          try {
            const [delegatees, bips] = await wnat.delegatesOf(address);
            let totalDelegated = 0;
            for (let i = 0; i < delegatees.length; i++) {
              totalDelegated += (Number(bips[i]) / 10000) * Number(ethers.formatEther(bal));
            }
            setDelegatedPower(totalDelegated);
          } catch {
            setDelegatedPower(0);
          }
        }
      } catch {
        setVotingPower(0);
        setDelegatedPower(0);
      }
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const vote = useCallback(
    async (proposalId: string, support: "for" | "against") => {
      setBusy(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setProposals((prev) =>
          prev.map((p) => {
            if (p.id === proposalId) {
              const alreadyVoted = p.voted;
              const power = votingPower || 1000;
              let forVotes = p.forVotes;
              let againstVotes = p.againstVotes;
              if (alreadyVoted === "for") forVotes -= power;
              if (alreadyVoted === "against") againstVotes -= power;
              if (support === "for") forVotes += power;
              else againstVotes += power;
              return { ...p, forVotes, againstVotes, voted: support };
            }
            return p;
          })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Vote failed");
      } finally {
        setBusy(false);
      }
    },
    [votingPower]
  );

  return { proposals, votingPower, delegatedPower, busy, error, vote, refresh };
}
