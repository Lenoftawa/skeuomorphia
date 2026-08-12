"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK } from "@/lib/flare";

const ERC721_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
  "function tokenURI(uint256) view returns (string)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

export interface NFTItem {
  contractAddress: string;
  tokenId: bigint;
  name: string;
  symbol: string;
  tokenURI: string;
  imageUrl: string | null;
}

const KNOWN_NFT_COLLECTIONS: Record<string, string> = {
  coston2: "",
  flare: "",
  songbird: "",
};

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
      const collectionAddr = KNOWN_NFT_COLLECTIONS[DEFAULT_NETWORK];
      if (!collectionAddr) {
        setNfts([]);
        return;
      }
      const contract = new ethers.Contract(collectionAddr, ERC721_ABI, provider);
      const balance = await contract.balanceOf(addr);
      const count = Number(balance);
      if (count === 0) {
        setNfts([]);
        return;
      }
      const items: NFTItem[] = [];
      const maxFetch = Math.min(count, 20);
      for (let i = 0; i < maxFetch; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(addr, i);
          let tokenURI = "";
          let imageUrl: string | null = null;
          try {
            tokenURI = await contract.tokenURI(tokenId);
            if (tokenURI.startsWith("ipfs://")) {
              imageUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
            } else if (tokenURI.startsWith("http")) {
              imageUrl = tokenURI;
            }
          } catch {}
          let name = "";
          let symbol = "";
          try { name = await contract.name(); } catch {}
          try { symbol = await contract.symbol(); } catch {}
          items.push({
            contractAddress: collectionAddr,
            tokenId,
            name,
            symbol,
            tokenURI,
            imageUrl,
          });
        } catch {
          continue;
        }
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
