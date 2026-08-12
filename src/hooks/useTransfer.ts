"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { getStableCoinContract, DEPLOYED_ADDRESSES } from "@/lib/contracts";
import { STABLE_COIN_DECIMALS } from "@/lib/flare";

export function useTransfer(signer: ethers.JsonRpcSigner | null) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const sendNative = useCallback(
    async (to: string, amount: string) => {
      if (!signer) {
        setError("Wallet not connected");
        return;
      }
      try {
        setBusy(true);
        setError(null);
        const tx = await signer.sendTransaction({
          to,
          value: ethers.parseEther(amount),
        });
        setLastTxHash(tx.hash);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transfer failed");
      } finally {
        setBusy(false);
      }
    },
    [signer]
  );

  const sendToken = useCallback(
    async (to: string, amount: string) => {
      if (!signer) {
        setError("Wallet not connected");
        return;
      }
      if (!DEPLOYED_ADDRESSES.stableCoin) {
        setError("No token contract deployed");
        return;
      }
      try {
        setBusy(true);
        setError(null);
        const contract = getStableCoinContract(signer, DEPLOYED_ADDRESSES.stableCoin);
        const tx = await contract.transfer(to, ethers.parseUnits(amount, STABLE_COIN_DECIMALS));
        setLastTxHash(tx.hash);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Token transfer failed");
      } finally {
        setBusy(false);
      }
    },
    [signer]
  );

  return { busy, error, lastTxHash, sendNative, sendToken };
}
