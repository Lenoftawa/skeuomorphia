"use client";

import { memo, useEffect, useState } from "react";
import {
  TokenAAVE,
  TokenADA,
  TokenALGO,
  TokenAPT,
  TokenARB,
  TokenATOM,
  TokenAVAX,
  TokenBCH,
  TokenBNB,
  TokenBTC,
  TokenDOGE,
  TokenDOT,
  TokenETC,
  TokenETH,
  TokenFET,
  TokenFIL,
  TokenFLR,
  TokenHBAR,
  TokenHNT,
  TokenHYPE,
  TokenICP,
  TokenJUP,
  TokenLEO,
  TokenLINK,
  TokenLTC,
  TokenMON,
  TokenNEAR,
  TokenOP,
  TokenPAXG,
  TokenPEPE,
  TokenPOL,
  TokenPYTH,
  TokenQNT,
  TokenRUNE,
  TokenSHIB,
  TokenSOL,
  TokenSUI,
  TokenTAO,
  TokenTON,
  TokenTRX,
  TokenUNI,
  TokenUSDC,
  TokenUSDT,
  TokenUSDX,
  TokenXDC,
  TokenXLM,
  TokenXPL,
  TokenXRP,
} from "@web3icons/react";

interface TokenLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

type StaticTokenIcon = typeof TokenFLR;

const STATIC_TOKEN_ICONS: Record<string, StaticTokenIcon> = {
  AAVE: TokenAAVE,
  ADA: TokenADA,
  ALGO: TokenALGO,
  APT: TokenAPT,
  ARB: TokenARB,
  ATOM: TokenATOM,
  AVAX: TokenAVAX,
  BCH: TokenBCH,
  BNB: TokenBNB,
  BTC: TokenBTC,
  DOGE: TokenDOGE,
  DOT: TokenDOT,
  ETC: TokenETC,
  ETH: TokenETH,
  FET: TokenFET,
  FIL: TokenFIL,
  FLR: TokenFLR,
  HBAR: TokenHBAR,
  HNT: TokenHNT,
  HYPE: TokenHYPE,
  ICP: TokenICP,
  JUP: TokenJUP,
  LEO: TokenLEO,
  LINK: TokenLINK,
  LTC: TokenLTC,
  MON: TokenMON,
  NEAR: TokenNEAR,
  OP: TokenOP,
  PAXG: TokenPAXG,
  PEPE: TokenPEPE,
  POL: TokenPOL,
  PYTH: TokenPYTH,
  QNT: TokenQNT,
  RUNE: TokenRUNE,
  SHIB: TokenSHIB,
  SOL: TokenSOL,
  SUI: TokenSUI,
  TAO: TokenTAO,
  TON: TokenTON,
  TRX: TokenTRX,
  UNI: TokenUNI,
  USDC: TokenUSDC,
  USDT: TokenUSDT,
  USDX: TokenUSDX,
  XDC: TokenXDC,
  XLM: TokenXLM,
  XPL: TokenXPL,
  XRP: TokenXRP,
};

const REMOTE_TOKEN_ICONS: Record<string, string> = {
  SGB: "https://logo.octav.fi/api/icon/songbird.png",
  USDS: "https://logo.octav.fi/api/icon/usds.png",
  WIF: "https://assets.coincap.io/assets/icons/wif@2x.png",
  BONK: "https://assets.coincap.io/assets/icons/bonk@2x.png",
  ETHFI: "https://assets.coincap.io/assets/icons/ethfi@2x.png",
  ENA: "https://assets.coincap.io/assets/icons/ena@2x.png",
  S: "https://logo.octav.fi/api/icon/sonic-3.png",
  ONDO: "https://assets.coincap.io/assets/icons/ondo@2x.png",
  RENDER: "https://assets.coincap.io/assets/icons/render@2x.png",
  NOT: "https://assets.coincap.io/assets/icons/not@2x.png",
  TRUMP: "https://assets.coincap.io/assets/icons/trump@2x.png",
  PENGU: "https://assets.coincap.io/assets/icons/pengu@2x.png",
  BERA: "https://assets.coincap.io/assets/icons/bera@2x.png",
  PUMP: "https://assets.coincap.io/assets/icons/pump@2x.png",
  NIGHT: "https://assets.coincap.io/assets/icons/night@2x.png",
};

function baseSymbol(symbol: string) {
  const normalized = symbol.toUpperCase();
  if (normalized === "WFLR" || normalized === "RFLR") return "FLR";
  if (/^F(BTC|XRP|DOGE|LTC|XLM)$/.test(normalized)) return normalized.slice(1);
  return normalized;
}

function SymbolFallback({ symbol, size }: { symbol: string; size: number }) {
  const hue = [...symbol].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full border border-white/20 font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.max(7, size * 0.34), backgroundColor: `hsl(${hue} 58% 34%)` }}
      aria-hidden="true"
    >
      {symbol.slice(0, 2)}
    </span>
  );
}

function RemoteTokenLogo({ symbol, size, url }: { symbol: string; size: number; url: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  if (failed) return <SymbolFallback symbol={symbol} size={size} />;

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      referrerPolicy="no-referrer"
      className="block rounded-full object-contain"
      onError={() => setFailed(true)}
      aria-hidden="true"
    />
  );
}

export const TokenLogo = memo(function TokenLogo({ symbol, size = 16, className = "" }: TokenLogoProps) {
  const normalized = symbol.toUpperCase();
  const iconSymbol = baseSymbol(normalized);
  const iconSize = Math.max(8, size - 4);
  const StaticIcon = STATIC_TOKEN_ICONS[iconSymbol];
  const remoteUrl = REMOTE_TOKEN_ICONS[iconSymbol];

  return (
    <span
      className={`token-logo inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${symbol} logo`}
      title={`${symbol} logo`}
    >
      {StaticIcon ? (
        <StaticIcon variant="branded" size={iconSize} />
      ) : remoteUrl ? (
        <RemoteTokenLogo symbol={normalized} size={iconSize} url={remoteUrl} />
      ) : (
        <SymbolFallback symbol={normalized} size={iconSize} />
      )}
    </span>
  );
});
