import { ethers } from "ethers";
import { FLARE_NETWORKS, DEFAULT_NETWORK, FTSO_SYMBOLS } from "./flare";
import { CONTRACT_REGISTRY_ABI } from "./contracts";
import type { PriceFeed } from "./types";

const network = FLARE_NETWORKS[DEFAULT_NETWORK];
const provider = new ethers.JsonRpcProvider(network.rpcUrl);
const contractRegistry = new ethers.Contract(network.contractRegistry, CONTRACT_REGISTRY_ABI, provider);
const FTSOV2_ABI = [
  "function getFeedsById(bytes21[] feedIds) payable returns (uint256[] values, int8[] decimals, uint64 timestamp)",
];
const FEE_CALCULATOR_ABI = [
  "function calculateFeeByIds(bytes21[] feedIds) view returns (uint256 fee)",
];
const DA_BASE_URL = "https://ctn2-data-availability.flare.network/api/v0";
// Browser-side fetches to the DA API are blocked by CORS. Route through
// the Next.js API proxy when running in the browser.
const DA_PROXY_URL = "/api/ftso-da?path=";
function daUrl(path: string): string {
  return typeof window !== "undefined" ? `${DA_PROXY_URL}${encodeURIComponent(path)}` : `${DA_BASE_URL}${path}`;
}
const ANCHOR_CACHE_MS = 300_000; // 5 min — avoid hitting DA API too frequently
const VOTING_ROUNDS_PER_DAY = 960;
const VOTING_ROUND_SECONDS = 90;

// Module-level in-flight guards to prevent concurrent duplicate DA API requests
let statusInFlight: Promise<FspStatus> | null = null;

export interface PriceHistoryPoint {
  price: number;
  timestamp: number;
}

export type PriceHistory = Record<string, PriceHistoryPoint[]>;

type AnchorFeedResponse = {
  body: {
    votingRoundId: number;
    id: string;
    value: number;
    turnoutBIPS: number;
    decimals: number;
  };
  proof: string[];
};

type FspStatus = {
  latest_ftso: {
    voting_round_id: number;
    start_timestamp: number;
  };
};

let protocolAddressesPromise: Promise<{ ftsoV2: string; feeCalculator: string }> | null = null;
let anchorCache: { expiresAt: number; prices: Map<string, number> } | null = null;

export function getFtsoFeedId(symbol: string): string {
  const feedName = `${symbol}/USD`;
  const encodedName = Array.from(feedName)
    .map((character) => character.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  return `0x${(`01${encodedName}`).padEnd(42, "0")}`;
}

export const FTSO_FEEDS = FTSO_SYMBOLS.map((symbol) => ({
  symbol,
  feedId: getFtsoFeedId(symbol),
}));

async function resolveProtocolAddresses() {
  if (!protocolAddressesPromise) {
    protocolAddressesPromise = Promise.all([
      contractRegistry.getContractAddressByName("FtsoV2") as Promise<string>,
      contractRegistry.getContractAddressByName("FeeCalculator") as Promise<string>,
    ]).then(([ftsoV2, feeCalculator]) => {
      if (ftsoV2 === ethers.ZeroAddress || feeCalculator === ethers.ZeroAddress) {
        throw new Error("FTSOv2 protocol contracts are unavailable on Coston2");
      }
      return { ftsoV2, feeCalculator };
    }).catch((error) => {
      protocolAddressesPromise = null;
      throw error;
    });
  }
  return protocolAddressesPromise;
}

function parseFeedValue(value: bigint | number, decimals: number): number {
  if (decimals >= 0) return Number(ethers.formatUnits(value, decimals));
  return Number(value) * 10 ** Math.abs(decimals);
}

async function fetchDaStatus(): Promise<FspStatus> {
  if (statusInFlight) return statusInFlight;
  statusInFlight = (async () => {
    const statusResponse = await fetch(daUrl("/fsp/status"));
    if (!statusResponse.ok) throw new Error(`FTSO status request failed (${statusResponse.status})`);
    return await statusResponse.json() as FspStatus;
  })();
  try {
    return await statusInFlight;
  } finally {
    statusInFlight = null;
  }
}

async function fetchPreviousDayPrices(): Promise<Map<string, number>> {
  if (anchorCache && anchorCache.expiresAt > Date.now()) return anchorCache.prices;

  const status = await fetchDaStatus();
  const votingRoundId = status.latest_ftso.voting_round_id - VOTING_ROUNDS_PER_DAY;

  const anchorResponse = await fetch(
    daUrl(`/ftso/anchor-feeds-with-proof?voting_round_id=${votingRoundId}`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feed_ids: FTSO_FEEDS.map((feed) => feed.feedId) }),
    }
  );
  if (!anchorResponse.ok) throw new Error(`FTSO anchor request failed (${anchorResponse.status})`);

  const anchors = await anchorResponse.json() as AnchorFeedResponse[];
  const prices = new Map(
    anchors.map((anchor) => [
      anchor.body.id.toLowerCase(),
      anchor.body.value / 10 ** anchor.body.decimals,
    ])
  );
  anchorCache = { expiresAt: Date.now() + ANCHOR_CACHE_MS, prices };
  return prices;
}

export async function fetchFtsoPrices(): Promise<PriceFeed[]> {
  const { ftsoV2, feeCalculator } = await resolveProtocolAddresses();
  const feedIds = FTSO_FEEDS.map((feed) => feed.feedId);
  const feeContract = new ethers.Contract(feeCalculator, FEE_CALCULATOR_ABI, provider);
  const fee = await feeContract.calculateFeeByIds(feedIds) as bigint;
  const ftsoV2Contract = new ethers.Contract(ftsoV2, FTSOV2_ABI, provider);
  const [values, decimals, timestamp] = await ftsoV2Contract.getFeedsById.staticCall(feedIds, { value: fee }) as [bigint[], bigint[], bigint];

  let previousDayPrices = new Map<string, number>();
  try {
    previousDayPrices = await fetchPreviousDayPrices();
  } catch {}

  return FTSO_FEEDS.map((feed, index) => {
    const decimalPlaces = Number(decimals[index]);
    const price = parseFeedValue(values[index], decimalPlaces);
    const previousPrice = previousDayPrices.get(feed.feedId.toLowerCase());
    const change24h = previousPrice && previousPrice > 0
      ? ((price - previousPrice) / previousPrice) * 100
      : 0;

    return {
      symbol: feed.symbol,
      feedId: feed.feedId,
      price,
      change24h,
      timestamp: Number(timestamp),
      decimals: decimalPlaces,
      source: "FTSOv2",
    };
  });
}

export function subscribeToPriceUpdates(
  callback: (prices: PriceFeed[]) => void,
  intervalMs: number = 5000,
  onError?: (error: Error) => void
): () => void {
  let active = true;
  let requestInFlight = false;

  const fetchAndCallback = async () => {
    if (!active || requestInFlight) return;
    requestInFlight = true;
    try {
      const prices = await fetchFtsoPrices();
      if (active) callback(prices);
    } catch (error) {
      if (active) onError?.(error instanceof Error ? error : new Error("FTSOv2 request failed"));
    } finally {
      requestInFlight = false;
    }
  };

  void fetchAndCallback();
  const pollInterval = setInterval(() => {
    void fetchAndCallback();
  }, Math.max(intervalMs, 3000));

  return () => {
    active = false;
    clearInterval(pollInterval);
  };
}

// Fetch finalized anchor-feed prices for the most recent `rounds` voting rounds
// (each round is 90s) and return them as per-symbol history series. Used to seed
// charts/sparklines with real past data instead of only points collected since
// the app was opened.
const HISTORY_CACHE_KEY = "flare-terminal-ftso-history";
const HISTORY_CACHE_TTL_MS = 5 * 60_000;

type HistoryCache = { expiresAt: number; rounds: number; history: PriceHistory };

function loadHistoryCache(rounds: number): PriceHistory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HISTORY_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as HistoryCache;
    if (cached.rounds !== rounds || cached.expiresAt < Date.now()) return null;
    return cached.history;
  } catch {
    return null;
  }
}

function saveHistoryCache(rounds: number, history: PriceHistory) {
  if (typeof window === "undefined") return;
  try {
    const payload: HistoryCache = { expiresAt: Date.now() + HISTORY_CACHE_TTL_MS, rounds, history };
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

async function fetchAnchorRound(votingRoundId: number): Promise<AnchorFeedResponse[]> {
  const url = daUrl(`/ftso/anchor-feeds-with-proof?voting_round_id=${votingRoundId}`);
  const body = JSON.stringify({ feed_ids: FTSO_FEEDS.map((feed) => feed.feedId) });
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (response.ok) return (await response.json()) as AnchorFeedResponse[];
    if (response.status === 429 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
    throw new Error(`FTSO anchor request failed (${response.status})`);
  }
  throw new Error("FTSO anchor request failed after retry");
}

export async function fetchFtsoHistory(rounds: number = 20): Promise<PriceHistory> {
  const cached = loadHistoryCache(rounds);
  if (cached) return cached;

  const status = await fetchDaStatus();
  const latestRound = status.latest_ftso.voting_round_id;
  const startRound = Math.max(0, latestRound - rounds + 1);

  const feedIdToSymbol = new Map(FTSO_FEEDS.map((feed) => [feed.feedId.toLowerCase(), feed.symbol]));
  const history: PriceHistory = {};
  const roundIds: number[] = [];
  for (let r = startRound; r <= latestRound; r++) roundIds.push(r);

  // Gentle throttling: sequential requests with 1s pause between each.
  // The DA API rate-limits aggressively (429) so we must not hammer it.
  const CONCURRENCY = 1;
  const BATCH_DELAY_MS = 1000;
  for (let i = 0; i < roundIds.length; i += CONCURRENCY) {
    const batch = roundIds.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((roundId) => fetchAnchorRound(roundId)));
    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") return;
      const roundId = batch[idx];
      const timestamp = roundId * VOTING_ROUND_SECONDS * 1000;
      for (const anchor of result.value) {
        const symbol = feedIdToSymbol.get(anchor.body.id.toLowerCase());
        if (!symbol) continue;
        const price = anchor.body.value / 10 ** anchor.body.decimals;
        if (!Number.isFinite(price)) continue;
        if (!history[symbol]) history[symbol] = [];
        history[symbol].push({ price, timestamp });
      }
    });
    if (i + CONCURRENCY < roundIds.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Sort each symbol's series ascending by timestamp and dedupe.
  for (const symbol of Object.keys(history)) {
    history[symbol].sort((a, b) => a.timestamp - b.timestamp);
    const deduped: PriceHistoryPoint[] = [];
    for (const point of history[symbol]) {
      const last = deduped[deduped.length - 1];
      if (last && last.timestamp === point.timestamp) continue;
      deduped.push(point);
    }
    history[symbol] = deduped;
  }

  saveHistoryCache(rounds, history);
  return history;
}
