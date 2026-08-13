import { NextRequest, NextResponse } from "next/server";
import { getAssetMeta } from "@/lib/assetMeta";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  summary: string;
}

const RSS_FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph" },
];

// Lightweight RSS/XML item extractor — avoids a dependency on an XML parser.
function parseRssItems(xml: string, source: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim() : "";
    };
    const title = get("title");
    const link = get("link");
    const pubDate = get("pubDate");
    const summary = get("description");
    if (title && link) articles.push({ title, link, pubDate, source, summary });
  }
  return articles;
}

function matchesAsset(article: NewsArticle, keywords: string[], symbol: string): boolean {
  const haystack = `${article.title} ${article.summary}`.toLowerCase();
  // Match the symbol as a standalone token (e.g. "BTC" but not "BTCX")
  // only for symbols >= 4 chars or when surrounded by word boundaries.
  const symbolPattern = new RegExp(`\\b${symbol.toLowerCase()}\\b`, "i");
  const symbolMatch = symbol.length >= 4 ? symbolPattern.test(haystack) : false;
  const keywordMatch = keywords.some((kw) => {
    const k = kw.toLowerCase();
    // Require at least 4-char keywords to avoid noise from short tokens.
    if (k.length < 4) return false;
    return haystack.includes(k);
  });
  return symbolMatch || keywordMatch;
}

function parseDate(dateStr: string): number {
  const t = Date.parse(dateStr);
  return isNaN(t) ? 0 : t;
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

  try {
    const feeds = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const res = await fetch(feed.url, {
          headers: { "User-Agent": "FlareTerminal/1.0 (+https://flare.network)" },
          // Cache the raw feed for 10 minutes at the edge to stay polite.
          next: { revalidate: 600 },
        });
        if (!res.ok) throw new Error(`${feed.source} feed returned ${res.status}`);
        const xml = await res.text();
        return parseRssItems(xml, feed.source);
      })
    );

    const all: NewsArticle[] = [];
    for (const result of feeds) {
      if (result.status === "fulfilled") all.push(...result.value);
    }

    const filtered = all
      .filter((a) => matchesAsset(a, meta.keywords, symbol))
      .sort((a, b) => parseDate(b.pubDate) - parseDate(a.pubDate))
      .slice(0, 20);

    return NextResponse.json(
      { symbol, articles: filtered },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 502 }
    );
  }
}
