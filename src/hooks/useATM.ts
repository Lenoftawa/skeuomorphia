"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import {
  getBearerNoteEscrowContract,
  getERC20Contract,
  DEPLOYED_ADDRESSES,
} from "@/lib/contracts";
import {
  generateSecret,
  generateBanknoteQR,
  parseTokenAmount,
} from "@/lib/atm";
import type { Transaction } from "@/lib/types";
import { SUPPORTED_ASSETS, type SupportedAsset } from "@/lib/flare";

export interface AssetBalance {
  symbol: string;
  balance: number;
  decimals: number;
}

export function useATM(signer: ethers.JsonRpcSigner | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastNoteQR, setLastNoteQR] = useState<string | null>(null);
  const [lastNoteId, setLastNoteId] = useState<number | null>(null);
  const [lastNoteSecret, setLastNoteSecret] = useState<string | null>(null);
  const [lastNoteAsset, setLastNoteAsset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});

  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev].slice(0, 50));
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!signer) return;
    const address = await signer.getAddress();
    const next: Record<string, number> = {};
    for (const asset of SUPPORTED_ASSETS) {
      if (!asset.address) {
        next[asset.symbol] = 0;
        continue;
      }
      try {
        const token = getERC20Contract(signer, asset.address);
        const raw = await token.balanceOf(address);
        next[asset.symbol] = Number(ethers.formatUnits(raw, asset.decimals));
      } catch {
        next[asset.symbol] = 0;
      }
    }
    setBalances(next);
  }, [signer]);

  const mintBanknote = useCallback(
    async (asset: SupportedAsset, denomination: number) => {
      if (!signer) {
        setError("Wallet not connected");
        return;
      }
      if (!DEPLOYED_ADDRESSES.bearerNoteEscrow) {
        setError("BearerNoteEscrow not deployed. Run npm run deploy.");
        return;
      }
      if (!asset.address) {
        setError(`${asset.symbol} address not configured`);
        return;
      }

      setLastNoteQR(null);
      setLastNoteId(null);
      setLastNoteSecret(null);
      setLastNoteAsset(null);
      setBusy(true);
      setError(null);
      try {
        const { secret, secretHash } = generateSecret();
        const escrow = getBearerNoteEscrowContract(signer, DEPLOYED_ADDRESSES.bearerNoteEscrow);
        const token = getERC20Contract(signer, asset.address);
        const amount = parseTokenAmount(denomination, asset.decimals);

        const approveTx = await token.approve(DEPLOYED_ADDRESSES.bearerNoteEscrow, amount);
        addTransaction({
          hash: approveTx.hash,
          type: "transfer",
          status: "pending",
          timestamp: Date.now(),
          details: `Approve ${denomination} ${asset.symbol}`,
        });
        await approveTx.wait();
        addTransaction({
          hash: approveTx.hash,
          type: "transfer",
          status: "confirmed",
          timestamp: Date.now(),
          details: `Approved ${denomination} ${asset.symbol}`,
        });

        const mintTx = await escrow.mintNote(asset.address, amount, secretHash, 0);
        addTransaction({
          hash: mintTx.hash,
          type: "mint",
          status: "pending",
          timestamp: Date.now(),
          details: `Minting ${denomination} ${asset.symbol} banknote`,
        });

        const receipt = await mintTx.wait();
        addTransaction({
          hash: mintTx.hash,
          type: "mint",
          status: "confirmed",
          timestamp: Date.now(),
          details: `${asset.symbol} banknote minted`,
        });

        let noteId = 0;
        for (const log of receipt.logs) {
          try {
            const parsed = escrow.interface.parseLog(log);
            if (parsed && parsed.name === "NoteMinted") {
              noteId = Number(parsed.args.noteId);
              break;
            }
          } catch {
            continue;
          }
        }

        if (noteId > 0) {
          const qr = await generateBanknoteQR(noteId, secret, denomination, asset.address, asset.symbol, asset.decimals);
          setLastNoteQR(qr);
          setLastNoteId(noteId);
          setLastNoteSecret(secret);
          setLastNoteAsset(asset.symbol);
        }

        await refreshBalances();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Mint failed";
        setError(message);
        addTransaction({
          hash: "",
          type: "mint",
          status: "failed",
          timestamp: Date.now(),
          details: message,
        });
      } finally {
        setBusy(false);
      }
    },
    [signer, addTransaction, refreshBalances]
  );

  const redeemBanknote = useCallback(
    async (
      noteId: number,
      secret: string,
      amount: number,
      assetSymbol: string,
      assetDecimals: number
    ) => {
      if (!signer) {
        setError("Wallet not connected");
        return;
      }
      if (!DEPLOYED_ADDRESSES.bearerNoteEscrow) {
        setError("BearerNoteEscrow not deployed. Run npm run deploy.");
        return;
      }

      setError(null);
      setBusy(true);
      try {
        const escrow = getBearerNoteEscrowContract(signer, DEPLOYED_ADDRESSES.bearerNoteEscrow);
        const merchantAddress = await signer.getAddress();
        const amountWei = parseTokenAmount(amount, assetDecimals);
        // The QR payload stores the secret as a 0x-prefixed 32-byte hex string.
        // Normalize to a valid bytes32 (left-pad if a shorter value was stored).
        const secretBytes32 = ethers.zeroPadValue(ethers.getBytes(secret), 32);
        const commitment = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "address", "uint256", "uint256"],
            [secretBytes32, merchantAddress, noteId, amountWei]
          )
        );

        const commitTx = await escrow.commitRedemption(noteId, commitment);
        addTransaction({
          hash: commitTx.hash,
          type: "redeem",
          status: "pending",
          timestamp: Date.now(),
          details: `Committing redemption for note #${noteId}`,
        });
        const commitReceipt = await commitTx.wait();
        addTransaction({
          hash: commitTx.hash,
          type: "redeem",
          status: "confirmed",
          timestamp: Date.now(),
          details: `Committed redemption for note #${noteId}`,
        });

        // The contract requires block.number > commit.blockNumber before reveal.
        // Wait for at least one new block to be mined on Coston2 (~2.5s blocks).
        const provider = signer.provider;
        const committedBlock = commitReceipt?.blockNumber ?? (await provider.getBlockNumber());
        let currentBlock = await provider.getBlockNumber();
        let waited = 0;
        while (currentBlock <= committedBlock && waited < 30000) {
          await new Promise((r) => setTimeout(r, 2000));
          currentBlock = await provider.getBlockNumber();
          waited += 2000;
        }
        if (currentBlock <= committedBlock) {
          throw new Error("Timed out waiting for commit maturity (no new block mined).");
        }

        const redeemTx = await escrow.redeemNote(noteId, secretBytes32, amountWei);
        addTransaction({
          hash: redeemTx.hash,
          type: "redeem",
          status: "pending",
          timestamp: Date.now(),
          details: `Redeeming note #${noteId} for ${amount} ${assetSymbol}`,
        });
        await redeemTx.wait();
        addTransaction({
          hash: redeemTx.hash,
          type: "redeem",
          status: "confirmed",
          timestamp: Date.now(),
          details: `Note #${noteId} redeemed for ${amount} ${assetSymbol}`,
        });

        await refreshBalances();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Redeem failed";
        setError(message);
        addTransaction({
          hash: "",
          type: "redeem",
          status: "failed",
          timestamp: Date.now(),
          details: message,
        });
      } finally {
        setBusy(false);
      }
    },
    [signer, addTransaction, refreshBalances]
  );

  // Auto-refresh asset balances whenever the wallet connects/changes.
  useEffect(() => {
    if (signer) refreshBalances();
  }, [signer, refreshBalances]);

  return {
    transactions,
    busy,
    error,
    lastNoteQR,
    lastNoteId,
    lastNoteSecret,
    lastNoteAsset,
    balances,
    mintBanknote,
    redeemBanknote,
    refreshBalances,
    setLastNoteQR,
    setError,
  };
}
