"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { DEPLOYED_ADDRESSES, ERC20_ABI, getSimpleSwapContract } from "@/lib/contracts";
import { SUPPORTED_ASSETS } from "@/lib/flare";
import type { PriceFeed } from "@/lib/types";

export interface SwapQuote {
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  priceImpact: number;
  minReceived: number;
}

export interface SwapToken {
  symbol: string;
  address: string;
  decimals: number;
}

// Tokens available for swapping through SimpleSwap
export const SWAP_TOKENS: SwapToken[] = [
  { symbol: "FLRD", address: DEPLOYED_ADDRESSES.stableCoin, decimals: 6 },
  { symbol: "FXRP", address: DEPLOYED_ADDRESSES.fxrp || "0x0b6A3645c240605887a5532109323A3E12273dc7", decimals: 6 },
];

export function useSwap(_prices: PriceFeed[], signer: ethers.JsonRpcSigner | null) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSwap, setLastSwap] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const getToken = (symbol: string): SwapToken | undefined =>
    SWAP_TOKENS.find((t) => t.symbol === symbol);

  const getQuote = useCallback(
    (fromSymbol: string, toSymbol: string, fromAmount: number): SwapQuote | null => {
      const fromToken = getToken(fromSymbol);
      const toToken = getToken(toSymbol);
      if (!fromToken || !toToken || !fromAmount || !DEPLOYED_ADDRESSES.simpleSwap) return null;

      // We can't do async view calls in a sync function, so return a placeholder
      // The real quote is fetched via getOnChainQuote
      return {
        fromSymbol,
        toSymbol,
        fromAmount,
        toAmount: 0, // filled by getOnChainQuote
        rate: 0,
        priceImpact: 0,
        minReceived: 0,
      };
    },
    []
  );

  const getOnChainQuote = useCallback(
    async (fromSymbol: string, toSymbol: string, fromAmount: number): Promise<SwapQuote | null> => {
      const fromToken = getToken(fromSymbol);
      const toToken = getToken(toSymbol);
      if (!fromToken || !toToken || !fromAmount || !DEPLOYED_ADDRESSES.simpleSwap) return null;

      try {
        const { ethers: ethersLib } = await import("ethers");
        const provider = new ethersLib.JsonRpcProvider("https://coston2-api.flare.network/ext/bc/C/rpc");
        const swap = getSimpleSwapContract(provider, DEPLOYED_ADDRESSES.simpleSwap);
        const amountIn = ethersLib.parseUnits(fromAmount.toString(), fromToken.decimals);
        const amountOut = await swap.getQuote(fromToken.address, toToken.address, amountIn);
        const toAmount = Number(ethersLib.formatUnits(amountOut, toToken.decimals));
        const rate = toAmount / fromAmount;
        const minReceived = toAmount * 0.99; // 1% slippage tolerance
        return {
          fromSymbol,
          toSymbol,
          fromAmount,
          toAmount,
          rate,
          priceImpact: 0, // real impact is embedded in the AMM formula
          minReceived,
        };
      } catch {
        return null;
      }
    },
    []
  );

  const executeSwap = useCallback(
    async (fromSymbol: string, toSymbol: string, fromAmount: number) => {
      if (!signer) {
        setError("Wallet not connected");
        return;
      }
      const fromToken = getToken(fromSymbol);
      const toToken = getToken(toSymbol);
      if (!fromToken || !toToken) {
        setError("Unsupported token pair");
        return;
      }
      if (!DEPLOYED_ADDRESSES.simpleSwap) {
        setError("Swap contract not deployed");
        return;
      }
      setBusy(true);
      setError(null);
      setLastSwap(null);
      setLastTxHash(null);
      try {
        const amountIn = ethers.parseUnits(fromAmount.toString(), fromToken.decimals);
        // 1. Approve the swap contract to spend tokens
        const token = new ethers.Contract(fromToken.address, ERC20_ABI, signer);
        const allowance = await token.allowance(await signer.getAddress(), DEPLOYED_ADDRESSES.simpleSwap);
        if (allowance < amountIn) {
          const approveTx = await token.approve(DEPLOYED_ADDRESSES.simpleSwap, ethers.MaxUint256);
          await approveTx.wait();
        }
        // 2. Get quote for minAmountOut (1% slippage)
        const swap = getSimpleSwapContract(signer, DEPLOYED_ADDRESSES.simpleSwap);
        const expectedOut = await swap.getQuote.staticCall(fromToken.address, toToken.address, amountIn);
        const minAmountOut = (expectedOut * 99n) / 100n;
        // 3. Execute swap
        const tx = await swap.swap(fromToken.address, toToken.address, amountIn, minAmountOut);
        await tx.wait();
        setLastTxHash(tx.hash);
        setLastSwap(`Swapped ${fromAmount} ${fromSymbol} → ${toSymbol} (tx: ${tx.hash.slice(0, 10)}...)`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Swap failed");
      } finally {
        setBusy(false);
      }
    },
    [signer]
  );

  return { busy, error, lastSwap, lastTxHash, getQuote, getOnChainQuote, executeSwap, swapTokens: SWAP_TOKENS };
}
