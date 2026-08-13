"use client";

import { useState, useEffect, useCallback } from "react";

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  summary: string;
}

export interface AssetInfo {
  symbol: string;
  name: string;
  description: string;
  categories: string[];
  links: { label: string; url: string }[];
  marketCapRank: number | null;
  sentimentUp: number | null;
  community: {
    twitterFollowers: number | null;
    redditSubscribers: number | null;
    githubStars: number | null;
  };
  developer: {
    commitCount4w: number | null;
    pullRequestCount4w: number | null;
  };
  genesisDate: string | null;
  hashingAlgorithm: string | null;
}

interface AssetNewsState {
  articles: NewsArticle[];
  info: AssetInfo | null;
  loading: boolean;
  error: string | null;
  refreshedAt: number | null;
}

export function useAssetNews(symbol: string | null) {
  const [state, setState] = useState<AssetNewsState>({
    articles: [],
    info: null,
    loading: false,
    error: null,
    refreshedAt: null,
  });

  const fetchNews = useCallback(async (sym: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [newsRes, infoRes] = await Promise.allSettled([
        fetch(`/api/asset-news?symbol=${encodeURIComponent(sym)}`).then((r) => r.json()),
        fetch(`/api/asset-info?symbol=${encodeURIComponent(sym)}`).then((r) => r.json()),
      ]);

      const articles =
        newsRes.status === "fulfilled" && newsRes.value?.articles ? newsRes.value.articles : [];
      const newsError =
        newsRes.status === "rejected"
          ? "News feed unavailable"
          : newsRes.value?.error && articles.length === 0
            ? newsRes.value.error
            : null;
      const info = infoRes.status === "fulfilled" ? infoRes.value?.info ?? null : null;

      setState({
        articles,
        info,
        loading: false,
        error: newsError,
        refreshedAt: Date.now(),
      });
    } catch (err) {
      setState({
        articles: [],
        info: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load asset news",
        refreshedAt: Date.now(),
      });
    }
  }, []);

  useEffect(() => {
    if (!symbol) {
      setState({ articles: [], info: null, loading: false, error: null, refreshedAt: null });
      return;
    }
    void fetchNews(symbol);
  }, [symbol, fetchNews]);

  return { ...state, refresh: () => (symbol ? fetchNews(symbol) : Promise.resolve()) };
}
