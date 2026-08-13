# Flare-Focused Token List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim the Market Data panel and ticker tape down to a small, explainable set of Flare-relevant symbols (FLR + FAssets underlyings), without changing how prices are fetched or what any other panel (Swap, Trading, Alerts, FAssets) receives.

**Architecture:** One new exported constant (`FLARE_FOCUS_SYMBOLS`) plus a filter derived in `TerminalPage` from the existing `useFTSO()` result. The filtered `focusPrices`/`focusHistory` are threaded through `SharedState` into `PanelRenderer` and used only by the `"market"` panel case and `<TickerTape>`; every other panel keeps using the original, unfiltered `prices`/`history`.

**Tech Stack:** Next.js 14 (App Router), TypeScript, React 18. No frontend test framework exists in this repo (only Hardhat contract tests under `test/`) — verification for this plan is `tsc --noEmit` for compile safety plus manual checks in the dev server, per the spec.

## Global Constraints

- No new data source or RPC calls — reuse the existing `useFTSO()` fetch (spec: "Non-goals").
- `SwapPanel`, `TradingPanel`, `PriceAlertsPanel`, `FAssetsPanel`, `DelegationPanel` must keep receiving the full, unfiltered `prices`/`history` — do not change their props (spec: "Non-goals").
- No UI toggle between focused and full views (spec: "Non-goals").
- Top status bar's `{prices.length} FTSOv2 FEEDS` counter and the Help panel's "57 assets" text must NOT change (spec: "Non-goals").
- `FLARE_FOCUS_SYMBOLS = ["FLR", "BTC", "XRP", "LTC", "XLM", "DOGE"]`, in exactly this order (spec: "New constant").

---

### Task 1: Add `FLARE_FOCUS_SYMBOLS` constant

**Files:**
- Modify: `src/lib/flare.ts`

**Interfaces:**
- Produces: `FLARE_FOCUS_SYMBOLS: string[]` — exported constant, consumed by Task 2.

- [ ] **Step 1: Install dependencies (environment has no `node_modules` yet)**

Run: `npm install`
Expected: completes without error; `node_modules/` exists afterward.

- [ ] **Step 2: Add the constant**

In `src/lib/flare.ts`, immediately after the closing `];` of `export const FTSO_SYMBOLS = [...]` (currently ends around line 51), add:

```ts
export const FLARE_FOCUS_SYMBOLS = ["FLR", "BTC", "XRP", "LTC", "XLM", "DOGE"];
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/flare.ts
git commit -m "Add FLARE_FOCUS_SYMBOLS constant for Market panel/ticker filtering"
```

---

### Task 2: Derive `focusPrices`/`focusHistory` and wire them into `TickerTape` and the Market panel

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `FLARE_FOCUS_SYMBOLS` from `src/lib/flare.ts` (Task 1); existing `prices: PriceFeed[]` and `history: PriceHistory` already produced by `useFTSO(5000)` in `TerminalPage`.
- Produces: `focusPrices: PriceFeed[]` and `focusHistory: PriceHistory` on `SharedState`, consumed by `PanelRenderer`'s `"market"` case and by `<TickerTape>`.

- [ ] **Step 1: Import the new constant**

In `src/app/page.tsx`, add to the existing imports from `@/lib/flare`. There is currently no such import in this file — add a new one near the other `@/lib/*` imports (after the `@/lib/types` import on line 44):

```ts
import { FLARE_FOCUS_SYMBOLS } from "@/lib/flare";
```

- [ ] **Step 2: Add `focusPrices`/`focusHistory` to the `SharedState` interface**

In the `SharedState` interface (around line 46), add the two new fields next to the existing `prices`/`history`:

```ts
interface SharedState {
  prices: PriceFeed[];
  focusPrices: PriceFeed[];
  loading: boolean;
  priceError: string | null;
  history: PriceHistory;
  focusHistory: PriceHistory;
  wallet: ReturnType<typeof useWallet>;
  atm: ReturnType<typeof useATM>;
  delegation: ReturnType<typeof useDelegation>;
  alerts: ReturnType<typeof usePriceAlerts>;
  transfer: ReturnType<typeof useTransfer>;
  governance: ReturnType<typeof useGovernance>;
  fassets: ReturnType<typeof useFAssets>;
  flaredrop: ReturnType<typeof useFlareDrop>;
  staking: ReturnType<typeof useStaking>;
  epochs: ReturnType<typeof useEpochs>;
  explorer: ReturnType<typeof useExplorer>;
  nfts: ReturnType<typeof useNFTs>;
  swap: ReturnType<typeof useSwap>;
  onPrint: () => void;
}
```

- [ ] **Step 3: Destructure the new fields in `PanelRenderer` and use them for the `"market"` case**

In `PanelRenderer` (around line 69), change the destructuring line:

```ts
const { prices, loading, priceError, history, wallet, atm, delegation, alerts, transfer, governance, fassets, flaredrop, staking, epochs, explorer, nfts, swap, onPrint } = state;
```

to:

```ts
const { prices, focusPrices, loading, priceError, history, focusHistory, wallet, atm, delegation, alerts, transfer, governance, fassets, flaredrop, staking, epochs, explorer, nfts, swap, onPrint } = state;
```

Then change the `"market"` case (around line 174):

```ts
case "market":
  return <MarketData prices={prices} loading={loading} error={priceError} history={history} />;
```

to:

```ts
case "market":
  return <MarketData prices={focusPrices} loading={loading} error={priceError} history={focusHistory} />;
```

Leave every other `case` in this `switch` (including `"trading"`, `"alerts"`, `"swap"`, which use `prices`/`history` for FAsset pricing etc.) exactly as-is — they must keep using `prices`/`history`, not `focusPrices`/`focusHistory`.

- [ ] **Step 4: Compute `focusPrices`/`focusHistory` in `TerminalPage`**

In `TerminalPage` (around line 452), directly below the existing line:

```ts
const { prices, loading, error: priceError, history: priceHistory } = useFTSO(5000);
```

add:

```ts
const focusSymbolSet = new Set<string>(FLARE_FOCUS_SYMBOLS);
const focusPrices = prices.filter((feed) => focusSymbolSet.has(feed.symbol));
const focusHistory: PriceHistory = Object.fromEntries(
  Object.entries(priceHistory).filter(([symbol]) => focusSymbolSet.has(symbol))
);
```

- [ ] **Step 5: Add the new fields to the `sharedState` object**

In the `sharedState` object literal (around line 505), add `focusPrices` and `focusHistory` alongside the existing `prices`/`history`:

```ts
const sharedState: SharedState = {
  prices,
  focusPrices,
  loading,
  priceError,
  history: priceHistory,
  focusHistory,
  wallet,
  atm,
  delegation,
  alerts,
  transfer,
  governance,
  fassets,
  flaredrop,
  staking,
  epochs,
  explorer,
  nfts,
  swap,
  onPrint: handlePrint,
};
```

- [ ] **Step 6: Point `<TickerTape>` at `focusPrices`**

Change the render call (around line 568):

```tsx
<TickerTape prices={prices} />
```

to:

```tsx
<TickerTape prices={focusPrices} />
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. In particular, confirm `focusHistory`'s inferred type matches `PriceHistory` (the explicit annotation in Step 4 should make this unambiguous) and that `PanelRenderer`'s `"market"` case still type-checks against `MarketData`'s existing `MarketDataProps`.

- [ ] **Step 8: Manual smoke check — types are correct but data is right too**

Run: `npm run dev`, open `http://localhost:3000`, and confirm:
- Ticker tape shows only `FLR, BTC, XRP, LTC, XLM, DOGE` (6 items, not ~60).
- The `focusHistory` keys match `focusPrices` symbols one-for-one (both were derived from the same `focusSymbolSet`, so this should hold by construction — this step is a visual confirmation, not a new code check).

Leave the app running; Task 3's verification continues from here.

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx
git commit -m "Filter Market panel and ticker tape to Flare-focused symbols"
```

---

### Task 3: Fix Market panel loading skeleton row count

**Files:**
- Modify: `src/components/MarketData.tsx`

**Interfaces:**
- Consumes: nothing new — this is a standalone visual fix in a component that already exists.

- [ ] **Step 1: Change the skeleton row count**

In `src/components/MarketData.tsx`, find the loading skeleton block (around line 70):

```tsx
{Array.from({ length: 7 }).map((_, index) => (
```

Change `7` to `6`:

```tsx
{Array.from({ length: 6 }).map((_, index) => (
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

With `npm run dev` still running (or restarted), hard-refresh `http://localhost:3000` and watch the Market Data panel (F1) during its brief loading state: confirm 6 skeleton rows appear, then 6 real rows replace them (not 6 real rows appearing under a 7-row skeleton).

- [ ] **Step 4: Commit**

```bash
git add src/components/MarketData.tsx
git commit -m "Match Market panel skeleton row count to focused symbol list"
```

---

### Task 4: Full manual verification pass

**Files:** none — this task is verification only, confirming the acceptance criteria from the spec's "Verification" section.

- [ ] **Step 1: Confirm Ticker + Market panel are focused**

With `npm run dev` running, confirm the ticker tape and the Market Data panel (F1) both show exactly `FLR, BTC, XRP, LTC, XLM, DOGE` with live, updating prices, and that sparklines render for each row in the Market panel (confirms `focusHistory` populated correctly).

- [ ] **Step 2: Confirm other panels were NOT scoped down**

Switch to (or open via `ADDCOL`/tabs) the Trading panel (F3), Price Alerts panel (F8), and Swap panel — confirm each still shows/offers the full, unfiltered symbol list (many more than 6 symbols), not just the focused 6. This is the check most likely to silently fail if `prices`/`history` were accidentally swapped for `focusPrices`/`focusHistory` somewhere they shouldn't be.

- [ ] **Step 3: Confirm unrelated UI text is untouched**

Confirm the top status bar still reads `{N} FTSOv2 FEEDS` where `N` is the full feed count (~60, unchanged), and that the Help panel (F6) still says "Real-time FTSO price feeds from Flare Network (57 assets)" unchanged.

- [ ] **Step 4: Final commit check**

Run: `git status`
Expected: clean working tree (Tasks 1–3 already committed their changes; this task produces no file changes).
