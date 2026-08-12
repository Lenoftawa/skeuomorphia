"use client";

import { useEffect, useState } from "react";
import type { useNFTs } from "@/hooks/useNFTs";

interface NFTGalleryPanelProps {
  isConnected: boolean;
  address: string | null;
  nfts: ReturnType<typeof useNFTs>;
  onConnect: () => void;
}

export function NFTGalleryPanel({ isConnected, address, nfts, onConnect }: NFTGalleryPanelProps) {
  const [fetched, setFetched] = useState(false);
  const { nfts: items, loading, error, fetchNFTs } = nfts;

  useEffect(() => {
    if (isConnected && address && !fetched) {
      fetchNFTs(address);
      setFetched(true);
    }
  }, [isConnected, address, fetched, fetchNFTs]);

  if (!isConnected) {
    return (
      <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
        <div className="terminal-header"><span>NFT GALLERY</span></div>
        <div className="terminal-content flex-1 flex items-center justify-center">
          <button className="atm-button" onClick={onConnect}>[ CONNECT WALLET ]</button>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>NFT GALLERY // COLLECTIBLES</span>
        <button
          className="text-[10px] text-terminal-white-dim hover:text-terminal-amber"
          onClick={() => address && fetchNFTs(address)}
          disabled={loading}
        >
          {loading ? "LOADING..." : "[REFRESH]"}
        </button>
      </div>
      <div className="terminal-content flex-1 overflow-auto p-2">
        {error && <div className="text-terminal-red text-[10px] glow-red mb-2">ERROR: {error}</div>}

        {loading && items.length === 0 && (
          <div className="text-terminal-amber text-[10px] animate-blink">FETCHING NFTs...</div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="text-center text-terminal-white-dim text-[10px] py-8">
            NO NFTs FOUND IN WALLET<br />
            <span className="text-[8px]">No known NFT collections on this network</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((nft, i) => (
            <div key={i} className="bg-terminal-panel border border-terminal-border p-2">
              {nft.imageUrl ? (
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className="w-full h-24 object-cover border border-terminal-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center border border-terminal-border bg-terminal-panel">
                  <span className="text-terminal-white-dim text-[10px]">NO IMAGE</span>
                </div>
              )}
              <div className="mt-1">
                <div className="text-terminal-amber text-[10px] font-bold">{nft.name || "Unknown"}</div>
                <div className="text-terminal-white-dim text-[8px]">#{nft.tokenId.toString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
