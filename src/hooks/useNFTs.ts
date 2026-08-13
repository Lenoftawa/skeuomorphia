"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";

const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256) view returns (string)",
];

export interface NFTItem {
  contractAddress: string;
  tokenId: bigint;
  name: string;
  symbol: string;
  tokenURI: string;
  imageUrl: string | null;
}

export function useNFTs(address: string | null) {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async (addr: string) => {
    const network = FLARE_NETWORKS[DEFAULT_NETWORK];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    setLoading(true);
    setError(null);
    try {
      // Use the explorer API to fetch ERC721 token transfers for this address
      // The Coston2 explorer supports an Etherscan-compatible API
      const url = `${network.explorerApi}?module=account&action=tokennfttx&address=${addr}&page=1&offset=100&sort=desc`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status !== "1" || !Array.isArray(data.result)) {
        setNfts([]);
        return;
      }

      // Filter for incoming transfers (where this address is the recipient)
      // and deduplicate by (contractAddress, tokenId)
      const seen = new Set<string>();
      const items: NFTItem[] = [];
      const contractsToQuery = new Map<string, { name: string; symbol: string }>();

      for (const tx of data.result) {
        if (tx.to?.toLowerCase() !== addr.toLowerCase()) continue;
        const key = `${tx.contractAddress}-${tx.tokenID}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Try to get contract name/symbol from cache or chain
        let name = "";
        let symbol = "";
        if (contractsToQuery.has(tx.contractAddress)) {
          const cached = contractsToQuery.get(tx.contractAddress)!;
          name = cached.name;
          symbol = cached.symbol;
        } else {
          try {
            const contract = new ethers.Contract(tx.contractAddress, ERC721_ABI, provider);
            [name, symbol] = await Promise.all([
              contract.name().catch(() => ""),
              contract.symbol().catch(() => ""),
            ]);
            contractsToQuery.set(tx.contractAddress, { name, symbol });
          } catch {
            contractsToQuery.set(tx.contractAddress, { name: "", symbol: "" });
          }
        }

        // Try to get token URI for metadata
        let tokenURI = "";
        let imageUrl: string | null = null;
        try {
          const contract = new ethers.Contract(tx.contractAddress, ERC721_ABI, provider);
          tokenURI = await contract.tokenURI(BigInt(tx.tokenID));
          if (tokenURI.startsWith("ipfs://")) {
            imageUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
          } else if (tokenURI.startsWith("http")) {
            imageUrl = tokenURI;
          }
        } catch {}

        items.push({
          contractAddress: tx.contractAddress,
          tokenId: BigInt(tx.tokenID),
          name,
          symbol,
          tokenURI,
          imageUrl,
        });
      }
      setNfts(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch NFTs");
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { nfts, loading, error, fetchNFTs };
}
