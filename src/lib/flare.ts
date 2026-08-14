export const FLARE_NETWORKS = {
  coston2: {
    chainId: 114,
    chainIdHex: "0x72",
    name: "Flare Coston2 Testnet",
    currency: "C2FLR",
    rpcUrl: "https://coston2-api.flare.network/ext/bc/C/rpc",
    explorerUrl: "https://coston2-explorer.flare.network",
    explorerApi: "https://coston2-explorer.flare.network/api",
    contractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
  },
  songbird: {
    chainId: 19,
    chainIdHex: "0x13",
    name: "Songbird Canary Network",
    currency: "SGB",
    rpcUrl: "https://songbird-api.flare.network/ext/bc/C/rpc",
    explorerUrl: "https://songbird-explorer.flare.network",
    explorerApi: "https://songbird-explorer.flare.network/api",
    contractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
  },
  flare: {
    chainId: 14,
    chainIdHex: "0xe",
    name: "Flare Mainnet",
    currency: "FLR",
    rpcUrl: "https://flare-api.flare.network/ext/bc/C/rpc",
    explorerUrl: "https://flare-explorer.flare.network",
    explorerApi: "https://flare-explorer.flare.network/api",
    contractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
  },
} as const;

export type FlareNetwork = keyof typeof FLARE_NETWORKS;
export type FlareNetworkConfig = (typeof FLARE_NETWORKS)[FlareNetwork];

export const DEFAULT_NETWORK: FlareNetwork = "coston2";

export const FTSO_SYMBOLS = [
  // Tier 1 — Core
  "FLR", "SGB", "BTC", "XRP", "LTC", "XLM", "DOGE", "ADA",
  // Tier 2 — Major caps
  "ETH", "ALGO", "FIL", "ARB", "AVAX", "BNB", "POL", "SOL",
  "USDC", "USDT", "XDC", "TRX", "LINK", "ATOM", "DOT", "TON",
  "ICP", "SHIB", "USDS", "BCH", "NEAR", "LEO", "UNI", "ETC",
  // Tier 3 — Emerging
  "WIF", "BONK", "JUP", "ETHFI", "ENA", "PYTH", "HNT", "SUI",
  "PEPE", "QNT", "AAVE", "S", "ONDO", "TAO", "FET", "RENDER",
  "NOT", "RUNE", "TRUMP", "HBAR", "PENGU", "HYPE", "APT",
  "PAXG", "BERA", "OP", "PUMP", "XPL", "MON", "NIGHT",
];

export const FLARE_FOCUS_SYMBOLS = ["FLR", "BTC", "XRP", "LTC", "XLM", "DOGE"];

export const DENOMINATIONS = [100, 50, 20, 10, 5, 1];

export const STABLE_COIN_DECIMALS = 6;

export interface SupportedAsset {
  symbol: string;
  address: string;
  decimals: number;
  kind: "stable" | "fasset";
  underlying?: string;
}

export const SUPPORTED_ASSETS: SupportedAsset[] = [
  {
    symbol: "FLRD",
    address: process.env.NEXT_PUBLIC_STABLECOIN_ADDRESS || "",
    decimals: 6,
    kind: "stable",
  },
  {
    symbol: "FXRP",
    address: process.env.NEXT_PUBLIC_FXRP_ADDRESS || "0x0b6A3645c240605887a5532109323A3E12273dc7",
    decimals: 6,
    kind: "fasset",
    underlying: "XRP",
  },
];

export const FASSET_TYPES = [
  { symbol: "fBTC", underlying: "BTC", chain: "Bitcoin", decimals: 8 },
  { symbol: "fXRP", underlying: "XRP", chain: "Ripple", decimals: 6 },
  { symbol: "fDOGE", underlying: "DOGE", chain: "Dogecoin", decimals: 8 },
  { symbol: "fLTC", underlying: "LTC", chain: "Litecoin", decimals: 8 },
  { symbol: "fXLM", underlying: "XLM", chain: "Stellar", decimals: 7 },
];

