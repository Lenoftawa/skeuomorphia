"use client";

import { useState } from "react";
import { useAssetNews } from "@/hooks/useAssetNews";

interface AssetNewsProps {
  symbol: string;
}

function timeAgo(dateStr: string): string {
  const t = Date.parse(dateStr);
  if (isNaN(t)) return "";
  const seconds = Math.floor((Date.now() - t) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatCount(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function AssetNews({ symbol }: AssetNewsProps) {
  const { articles, info, loading, error, refresh } = useAssetNews(symbol);
  const [tab, setTab] = useState<"news" | "overview">("news");

  return (
    <div className="border-t border-terminal-border bg-terminal-panel">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-terminal-border">
        <button
          className={`text-[9px] px-2 py-0.5 tracking-wider transition-colors ${
            tab === "news"
              ? "text-terminal-amber border-b border-terminal-amber"
              : "text-terminal-white-dim hover:text-terminal-white"
          }`}
          onClick={() => setTab("news")}
        >
          NEWS &amp; EVENTS
        </button>
        <button
          className={`text-[9px] px-2 py-0.5 tracking-wider transition-colors ${
            tab === "overview"
              ? "text-terminal-amber border-b border-terminal-amber"
              : "text-terminal-white-dim hover:text-terminal-white"
          }`}
          onClick={() => setTab("overview")}
        >
          ASSET INFO
        </button>
        <button
          className="ml-auto text-[9px] text-terminal-white-dim hover:text-terminal-amber transition-colors"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "⟳ LOADING" : "[↻ REFRESH]"}
        </button>
      </div>

      <div className="max-h-[240px] overflow-auto">
        {loading && articles.length === 0 && !info && (
          <div className="px-3 py-3 text-terminal-amber text-[10px] animate-pulse tracking-wider">
            FETCHING NEWS &amp; EVENTS FOR {symbol}...
          </div>
        )}

        {tab === "news" && (
          <div className="divide-y divide-terminal-border/50">
            {!loading && articles.length === 0 && (
              <div className="px-3 py-3 text-terminal-white-dim text-[10px]">
                {error ? `No news feed available: ${error}` : `No recent news found for ${symbol}.`}
              </div>
            )}
            {articles.map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-1.5 hover:bg-terminal-amber/5 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <span className="text-terminal-cyan text-[9px] font-bold mt-0.5 shrink-0">
                    {article.source.slice(0, 4).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-terminal-white text-[11px] leading-tight group-hover:text-terminal-amber transition-colors line-clamp-2">
                      {article.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-terminal-white-faint text-[9px]">{article.source}</span>
                      {article.pubDate && (
                        <span className="text-terminal-white-faint text-[9px]">{timeAgo(article.pubDate)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {tab === "overview" && (
          <div className="p-3 space-y-2.5">
            {!loading && !info && (
              <div className="text-terminal-white-dim text-[10px]">
                {error ? `Asset info unavailable: ${error}` : `No CoinGecko data available for ${symbol}.`}
              </div>
            )}
            {info && (
              <>
                {/* Header row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-terminal-amber text-xs font-bold">{info.name}</span>
                  {info.marketCapRank !== null && (
                    <span className="text-[9px] text-terminal-white-dim border border-terminal-border px-1.5 py-0.5">
                      RANK #{info.marketCapRank}
                    </span>
                  )}
                  {info.sentimentUp !== null && (
                    <span className={`text-[9px] px-1.5 py-0.5 ${info.sentimentUp >= 50 ? "text-terminal-green" : "text-terminal-red"}`}>
                      SENTIMENT {info.sentimentUp.toFixed(0)}% BULL
                    </span>
                  )}
                </div>

                {/* Categories */}
                {info.categories.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {info.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-[8px] text-terminal-purple border border-terminal-purple/30 bg-terminal-purple/5 px-1.5 py-0.5 tracking-wider uppercase"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {info.description && (
                  <p className="text-terminal-white-dim text-[10px] leading-relaxed line-clamp-4">
                    {info.description}
                  </p>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-terminal-panel border border-terminal-border p-1.5">
                    <div className="text-terminal-white-faint text-[8px] tracking-wider">TWITTER</div>
                    <div className="text-terminal-white text-[11px] font-bold tabular-nums">
                      {formatCount(info.community.twitterFollowers)}
                    </div>
                  </div>
                  <div className="bg-terminal-panel border border-terminal-border p-1.5">
                    <div className="text-terminal-white-faint text-[8px] tracking-wider">REDDIT</div>
                    <div className="text-terminal-white text-[11px] font-bold tabular-nums">
                      {formatCount(info.community.redditSubscribers)}
                    </div>
                  </div>
                  <div className="bg-terminal-panel border border-terminal-border p-1.5">
                    <div className="text-terminal-white-faint text-[8px] tracking-wider">COMMITS/4W</div>
                    <div className="text-terminal-white text-[11px] font-bold tabular-nums">
                      {formatCount(info.developer.commitCount4w)}
                    </div>
                  </div>
                </div>

                {/* Genesis date & algorithm */}
                {(info.genesisDate || info.hashingAlgorithm) && (
                  <div className="flex items-center gap-3 text-[9px] text-terminal-white-dim">
                    {info.genesisDate && <span>LAUNCHED: {info.genesisDate}</span>}
                    {info.hashingAlgorithm && <span>ALGO: {info.hashingAlgorithm}</span>}
                  </div>
                )}

                {/* Links */}
                {info.links.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {info.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-terminal-cyan hover:text-terminal-amber border border-terminal-border px-1.5 py-0.5 transition-colors"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
