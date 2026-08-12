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
const ANCHOR_CACHE_MS = 90_000;
const VOTING_ROUNDS_PER_DAY = 960;

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

async function fetchPreviousDayPrices(): Promise<Map<string, number>> {
  if (anchorCache && anchorCache.expiresAt > Date.now()) return anchorCache.prices;

  const statusResponse = await fetch(`${DA_BASE_URL}/fsp/status`);
  if (!statusResponse.ok) throw new Error(`FTSO status request failed (${statusResponse.status})`);
  const status = await statusResponse.json() as FspStatus;
  const votingRoundId = status.latest_ftso.voting_round_id - VOTING_ROUNDS_PER_DAY;

  const anchorResponse = await fetch(
    `${DA_BASE_URL}/ftso/anchor-feeds-with-proof?voting_round_id=${votingRoundId}`,
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
