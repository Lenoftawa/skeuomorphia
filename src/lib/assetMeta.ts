// Metadata for each FTSO-tracked asset: display name, CoinGecko coin id, and
// extra keywords used to match RSS news articles. Kept in FTSO_SYMBOLS order.

export interface AssetMeta {
  symbol: string;
  name: string;
  coingeckoId: string | null;
  keywords: string[];
}

export const ASSET_META: Record<string, AssetMeta> = {
  // Tier 1 — Core
  FLR: { symbol: "FLR", name: "Flare", coingeckoId: "flare-networks", keywords: ["Flare Network", "Flare token", "FTSO", "Flare chain"] },
  SGB: { symbol: "SGB", name: "Songbird", coingeckoId: "songbird", keywords: ["Songbird network", "Songbird chain"] },
  BTC: { symbol: "BTC", name: "Bitcoin", coingeckoId: "bitcoin", keywords: ["BTC", "Bitcoin"] },
  XRP: { symbol: "XRP", name: "XRP", coingeckoId: "ripple", keywords: ["Ripple", "XRP"] },
  LTC: { symbol: "LTC", name: "Litecoin", coingeckoId: "litecoin", keywords: ["Litecoin", "LTC"] },
  XLM: { symbol: "XLM", name: "Stellar Lumens", coingeckoId: "stellar", keywords: ["Stellar", "XLM", "Lumens"] },
  DOGE: { symbol: "DOGE", name: "Dogecoin", coingeckoId: "dogecoin", keywords: ["Dogecoin", "DOGE"] },
  ADA: { symbol: "ADA", name: "Cardano", coingeckoId: "cardano", keywords: ["Cardano", "ADA"] },
  // Tier 2 — Major caps
  ETH: { symbol: "ETH", name: "Ethereum", coingeckoId: "ethereum", keywords: ["Ethereum", "ETH", "Vitalik"] },
  ALGO: { symbol: "ALGO", name: "Algorand", coingeckoId: "algorand", keywords: ["Algorand", "ALGO"] },
  FIL: { symbol: "FIL", name: "Filecoin", coingeckoId: "filecoin", keywords: ["Filecoin", "FIL"] },
  ARB: { symbol: "ARB", name: "Arbitrum", coingeckoId: "arbitrum", keywords: ["Arbitrum", "ARB"] },
  AVAX: { symbol: "AVAX", name: "Avalanche", coingeckoId: "avalanche-2", keywords: ["Avalanche", "AVAX"] },
  BNB: { symbol: "BNB", name: "BNB", coingeckoId: "binancecoin", keywords: ["BNB", "Binance Coin"] },
  POL: { symbol: "POL", name: "Polygon", coingeckoId: "polygon-ecosystem-token", keywords: ["Polygon", "POL", "MATIC"] },
  SOL: { symbol: "SOL", name: "Solana", coingeckoId: "solana", keywords: ["Solana", "SOL"] },
  USDC: { symbol: "USDC", name: "USD Coin", coingeckoId: "usd-coin", keywords: ["USDC", "USD Coin", "Circle"] },
  USDT: { symbol: "USDT", name: "Tether", coingeckoId: "tether", keywords: ["USDT", "Tether"] },
  XDC: { symbol: "XDC", name: "XDC Network", coingeckoId: "xdce-crowd-sale", keywords: ["XDC Network", "XDC"] },
  TRX: { symbol: "TRX", name: "TRON", coingeckoId: "tron", keywords: ["TRON", "TRX", "Justin Sun"] },
  LINK: { symbol: "LINK", name: "Chainlink", coingeckoId: "chainlink", keywords: ["Chainlink", "LINK"] },
  ATOM: { symbol: "ATOM", name: "Cosmos", coingeckoId: "cosmos", keywords: ["Cosmos", "ATOM"] },
  DOT: { symbol: "DOT", name: "Polkadot", coingeckoId: "polkadot", keywords: ["Polkadot", "DOT"] },
  TON: { symbol: "TON", name: "Toncoin", coingeckoId: "the-open-network", keywords: ["Toncoin", "TON", "The Open Network"] },
  ICP: { symbol: "ICP", name: "Internet Computer", coingeckoId: "internet-computer", keywords: ["Internet Computer", "ICP", "Dfinity"] },
  SHIB: { symbol: "SHIB", name: "Shiba Inu", coingeckoId: "shiba-inu", keywords: ["Shiba Inu", "SHIB"] },
  USDS: { symbol: "USDS", name: "Sky Dollar", coingeckoId: "sky", keywords: ["USDS", "Sky", "Sky Dollar", "MakerDAO"] },
  BCH: { symbol: "BCH", name: "Bitcoin Cash", coingeckoId: "bitcoin-cash", keywords: ["Bitcoin Cash", "BCH"] },
  NEAR: { symbol: "NEAR", name: "NEAR Protocol", coingeckoId: "near", keywords: ["NEAR Protocol", "NEAR"] },
  LEO: { symbol: "LEO", name: "LEO Token", coingeckoId: "leo-token", keywords: ["LEO Token", "Bitfinex LEO"] },
  UNI: { symbol: "UNI", name: "Uniswap", coingeckoId: "uniswap", keywords: ["Uniswap", "UNI"] },
  ETC: { symbol: "ETC", name: "Ethereum Classic", coingeckoId: "ethereum-classic", keywords: ["Ethereum Classic", "ETC"] },
  // Tier 3 — Emerging
  WIF: { symbol: "WIF", name: "dogwifhat", coingeckoId: "dogwifcoin", keywords: ["dogwifhat", "WIF"] },
  BONK: { symbol: "BONK", name: "Bonk", coingeckoId: "bonk", keywords: ["Bonk", "BONK"] },
  JUP: { symbol: "JUP", name: "Jupiter", coingeckoId: "jupiter-exchange-solana", keywords: ["Jupiter", "JUP", "Jupiter Exchange"] },
  ETHFI: { symbol: "ETHFI", name: "Ether.fi", coingeckoId: "ether-fi", keywords: ["Ether.fi", "ETHFI"] },
  ENA: { symbol: "ENA", name: "Ethena", coingeckoId: "ethena", keywords: ["Ethena", "ENA", "USDe"] },
  PYTH: { symbol: "PYTH", name: "Pyth Network", coingeckoId: "pyth-network", keywords: ["Pyth Network", "PYTH"] },
  HNT: { symbol: "HNT", name: "Helium", coingeckoId: "helium", keywords: ["Helium", "HNT"] },
  SUI: { symbol: "SUI", name: "Sui", coingeckoId: "sui", keywords: ["Sui", "SUI"] },
  PEPE: { symbol: "PEPE", name: "Pepe", coingeckoId: "pepe", keywords: ["Pepe", "PEPE"] },
  QNT: { symbol: "QNT", name: "Quant", coingeckoId: "quant-network", keywords: ["Quant", "QNT", "Quant Network"] },
  AAVE: { symbol: "AAVE", name: "Aave", coingeckoId: "aave", keywords: ["Aave", "AAVE"] },
  S: { symbol: "S", name: "Sonic", coingeckoId: "sonic-3", keywords: ["Sonic", "S token", "Sonic SVM"] },
  ONDO: { symbol: "ONDO", name: "Ondo", coingeckoId: "ondo-finance", keywords: ["Ondo", "ONDO", "Ondo Finance"] },
  TAO: { symbol: "TAO", name: "Bittensor", coingeckoId: "bittensor", keywords: ["Bittensor", "TAO"] },
  FET: { symbol: "FET", name: "Artificial Super Intelligence", coingeckoId: "fetch-ai", keywords: ["Fetch.ai", "FET", "Artificial Super Intelligence", "ASI"] },
  RENDER: { symbol: "RENDER", name: "Render", coingeckoId: "render-token", keywords: ["Render", "RENDER", "Render Network"] },
  NOT: { symbol: "NOT", name: "Notcoin", coingeckoId: "notcoin", keywords: ["Notcoin", "NOT"] },
  RUNE: { symbol: "RUNE", name: "THORChain", coingeckoId: "thorchain", keywords: ["THORChain", "RUNE"] },
  TRUMP: { symbol: "TRUMP", name: "Official Trump", coingeckoId: "official-trump", keywords: ["Trump", "TRUMP", "Official Trump"] },
  HBAR: { symbol: "HBAR", name: "Hedera", coingeckoId: "hedera-hashgraph", keywords: ["Hedera", "HBAR", "Hashgraph"] },
  PENGU: { symbol: "PENGU", name: "Pudgy Penguins", coingeckoId: "pudgy-penguins", keywords: ["Pudgy Penguins", "PENGU"] },
  HYPE: { symbol: "HYPE", name: "Hyperliquid", coingeckoId: "hyperliquid", keywords: ["Hyperliquid", "HYPE"] },
  APT: { symbol: "APT", name: "Aptos", coingeckoId: "aptos", keywords: ["Aptos", "APT"] },
  PAXG: { symbol: "PAXG", name: "PAX Gold", coingeckoId: "pax-gold", keywords: ["PAX Gold", "PAXG"] },
  BERA: { symbol: "BERA", name: "Berachain", coingeckoId: "berachain-bera", keywords: ["Berachain", "BERA"] },
  OP: { symbol: "OP", name: "Optimism", coingeckoId: "optimism", keywords: ["Optimism", "OP"] },
  PUMP: { symbol: "PUMP", name: "Pump.fun", coingeckoId: "pump-fun", keywords: ["Pump.fun", "PUMP"] },
  XPL: { symbol: "XPL", name: "Explorer", coingeckoId: null, keywords: ["XPL", "Explorer token"] },
  MON: { symbol: "MON", name: "Monad", coingeckoId: "monad", keywords: ["Monad", "MON"] },
  NIGHT: { symbol: "NIGHT", name: "Midnight", coingeckoId: null, keywords: ["Midnight", "NIGHT token"] },
};

export function getAssetMeta(symbol: string): AssetMeta | null {
  return ASSET_META[symbol] ?? null;
}
