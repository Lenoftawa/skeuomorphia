import { NextRequest, NextResponse } from "next/server";
import { getAssetMeta } from "@/lib/assetMeta";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface AssetInfo {
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

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase().trim();
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 });
  }
  const meta = getAssetMeta(symbol);
  if (!meta) {
    return NextResponse.json({ error: `Unknown asset: ${symbol}` }, { status: 404 });
  }
  if (!meta.coingeckoId) {
    return NextResponse.json({ info: null, message: `No CoinGecko data for ${symbol}` });
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${meta.coingeckoId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`,
      {
        headers: { accept: "application/json" },
        next: { revalidate: 600 },
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { info: null, message: `CoinGecko returned ${res.status} for ${symbol}` },
        { status: 200 }
      );
    }
    const data = await res.json();

    const links: { label: string; url: string }[] = [];
    const rawLinks = data.links ?? {};
    if (rawLinks.homepage?.[0]) links.push({ label: "Website", url: rawLinks.homepage[0] });
    if (rawLinks.twitter_screen_name)
      links.push({ label: "Twitter/X", url: `https://x.com/${rawLinks.twitter_screen_name}` });
    if (rawLinks.subreddit_url) links.push({ label: "Reddit", url: rawLinks.subreddit_url });
    if (rawLinks.repos_url?.github?.[0]) links.push({ label: "GitHub", url: rawLinks.repos_url.github[0] });
    if (rawLinks.blockchain_site?.[0]) links.push({ label: "Explorer", url: rawLinks.blockchain_site[0] });

    const community = data.community_data ?? {};
    const developer = data.developer_data ?? {};
    const marketData = data.market_data ?? {};

    const info: AssetInfo = {
      symbol,
      name: data.name ?? meta.name,
      description: (data.description?.en ?? "").replace(/<[^>]+>/g, "").trim().slice(0, 600),
      categories: (data.categories ?? []).filter(Boolean).slice(0, 6),
      links,
      marketCapRank: data.market_cap_rank ?? null,
      sentimentUp: data.sentiment_votes_up_percentage ?? null,
      community: {
        twitterFollowers: community.twitter_followers ?? null,
        redditSubscribers: community.reddit_subscribers ?? null,
        githubStars: null,
      },
      developer: {
        commitCount4w: developer.commit_count_4_weeks ?? null,
        pullRequestCount4w: developer.pull_request_contributors ?? null,
      },
      genesisDate: data.genesis_date ?? null,
      hashingAlgorithm: data.hashing_algorithm ?? null,
    };

    return NextResponse.json(
      { info },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } }
    );
  } catch (error) {
    return NextResponse.json(
      { info: null, message: error instanceof Error ? error.message : "CoinGecko request failed" },
      { status: 200 }
    );
  }
}
