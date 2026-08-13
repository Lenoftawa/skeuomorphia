# Flare-Focused Token List (Market Panel + Ticker)

## Problem

`FTSO_SYMBOLS` in `src/lib/flare.ts` lists ~60 generic top-market-cap symbols (BTC, PEPE, TRUMP, HYPE, ...). This full list is fetched once via `useFTSO()` in `src/app/page.tsx` and the resulting `prices`/`history` are threaded into every panel that shows price data: `MarketData`, `TickerTape`, `TradingPanel`, `PriceAlertsPanel`, `SwapPanel`, and (via `useFAssets`) `FAssetsPanel`.

Most of those 60 symbols have no relationship to this app — they aren't native Flare tokens and aren't underlyings of any asset the app supports or plans to support. The Market Data panel and the ticker tape read as generic-crypto noise rather than "what this app actually cares about." Swap, Trading, Alerts, and FAssets legitimately want the broad list (e.g. Swap lets you pick among many symbols).

## Goal

Trim what the **Market Data panel** and **Ticker tape** display down to a small, explainable set of Flare-relevant symbols, without touching what any other panel receives or how prices are fetched.

## Non-goals

- No new data source (CoinGecko or otherwise) — this stays entirely on the existing on-chain FTSOv2 fetch. (A CoinGecko-backed "Flare ecosystem tokens" screener showing real deployed Flare project tokens was discussed as a separate, larger follow-on idea — out of scope here.)
- No change to `SwapPanel`, `TradingPanel`, `PriceAlertsPanel`, `FAssetsPanel`, or `DelegationPanel` — they keep consuming the full, unfiltered `prices`/`history`.
- No UI toggle between "focused" and "full" views — this is a permanent trim of two components' inputs, not a user-facing setting.
- No change to the top status bar's `{prices.length} FTSOv2 FEEDS` counter or the Help panel's "57 assets" line — both describe the app's overall FTSO capability, which is unchanged (Swap/Trading/etc. still use the full list).

## Design

### New constant

Add to `src/lib/flare.ts`, near `FTSO_SYMBOLS`:

```ts
export const FLARE_FOCUS_SYMBOLS = ["FLR", "BTC", "XRP", "LTC", "XLM", "DOGE"];
```

Composition: `FLR` (Flare's native token) plus the underlyings of every asset in `FASSET_TYPES` (`fBTC→BTC`, `fXRP→XRP`, `fDOGE→DOGE`, `fLTC→LTC`, `fXLM→XLM`) — i.e. the live FXRP asset plus the full FAssets roadmap. Songbird (`SGB`) is deliberately excluded: the app's stated scope (README, network config) is Flare mainnet/Coston2, not Songbird, and including it with no explanation would be a loose thread.

Order matches `FTSO_SYMBOLS`'s existing relative order (`FLR` first, then `BTC, XRP, LTC, XLM, DOGE` in the order they already appear in `FTSO_SYMBOLS`'s tier list) rather than being hand-sorted — this lets the filtering logic be a plain membership check with no separate sort step, one less thing to maintain.

### Filtering point

In `src/app/page.tsx`, `TerminalPage` already calls:

```ts
const { prices, loading, error: priceError, history: priceHistory } = useFTSO(5000);
```

Derive filtered versions from the same result (no new fetch, no new hook call):

```ts
const focusSymbols = new Set(FLARE_FOCUS_SYMBOLS);
const focusPrices = prices.filter((p) => focusSymbols.has(p.symbol));
const focusHistory = Object.fromEntries(
  Object.entries(priceHistory).filter(([symbol]) => focusSymbols.has(symbol))
);
```

Pass `focusPrices` (and `focusHistory` where relevant) only to:
- `<TickerTape prices={focusPrices} />`
- the `"market"` case in `PanelRenderer`: `<MarketData prices={focusPrices} loading={loading} error={priceError} history={focusHistory} />`

Every other panel/case in `PanelRenderer` keeps using the original `prices`/`history` from `sharedState`, unchanged.

**Sanity check during implementation:** confirm `focusHistory`'s keys are exactly the same symbol subset as `focusPrices` (both derived from the same `focusSymbols` set, so they should stay in sync by construction) — `MarketData`'s sparklines/chart key off `history[symbol]`, so a mismatch here would silently break just that one visual rather than throwing.

### Cosmetic follow-up

`src/components/MarketData.tsx`'s loading skeleton currently renders `Array.from({ length: 7 })` placeholder rows. Change to `6` to match the new focused count — otherwise a demo would show 6 real rows loading into a 7-row skeleton.

### Files touched

1. `src/lib/flare.ts` — add `FLARE_FOCUS_SYMBOLS`.
2. `src/app/page.tsx` — derive `focusPrices`/`focusHistory`, pass to `TickerTape` and the `"market"` panel case only.
3. `src/components/MarketData.tsx` — skeleton row count 7 → 6.

No other files change.

## Verification

No frontend test suite exists (only Hardhat contract tests under `test/`), so this is verified manually via `npm run dev`:

1. Ticker tape shows exactly `FLR, BTC, XRP, LTC, XLM, DOGE` with live prices — not the full ~60-symbol list.
2. Market Data panel (F1) shows the same 6 symbols, sparklines render for each (confirming `focusHistory` stayed in sync with `focusPrices`), loading skeleton shows 6 rows.
3. Swap panel, Trading panel, and Price Alerts panel still show/offer the full, unfiltered symbol list — confirming they weren't accidentally scoped down too.
4. Top status bar's feed count and the Help panel's "57 assets" text are unchanged and still read correctly against the full list.
