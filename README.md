# Flare Terminal — Interoperable Bearer Notes

> Turn interoperable assets on Flare into programmable digital cash.

Flare Terminal is a Bloomberg-style terminal with a skeuomorphic ATM that lets users lock supported ERC-20 assets into on-chain **bearer notes**, share them via printable QR codes, and let any recipient redeem the value with a Flare wallet. Notes support **partial merchant redemption** — unused value is automatically returned to the issuer.

Built for the **Flare Summer Signal** hackathon, **Bounty 1 — Interoperable Asset Products**.

## Product Description

Interoperable assets on Flare (FXRP and other FAssets) are powerful but hard to use for everyday person-to-person payments. Flare Terminal makes them feel like physical cash:

1. **Issuer** locks a supported asset (FLRD or FXRP) into a bearer note via the ATM interface.
2. The terminal generates a **QR-coded banknote** containing the note ID, secret, denomination, and asset metadata.
3. The issuer shares the note (print, screenshot, message).
4. A **merchant** scans/pastes the QR, commits a redemption, waits one block, and reveals the secret.
5. The merchant receives the requested amount; **unused value returns to the issuer** automatically.

## Target User

Crypto users and merchants who want to transfer interoperable assets through a familiar cash-like experience without copying addresses or navigating DeFi interfaces — especially in-person payments, gifts, vouchers, events, and low-friction merchant settlement.

## How the Project Uses Flare

| Flare component | Usage |
|---|---|
| **Flare C-chain (Coston2)** | Bearer-note escrow, settlement, and token transfers |
| **FAssets / FXRP** | Interoperable asset used as note collateral (FXRP ERC-20) |
| **FTSOv2** | Live decentralized price feeds for 57+ assets via Flare's Contract Registry and FeeCalculator |
| **Flare Contract Registry** | Dynamic protocol address discovery (FtsoV2, FeeCalculator, WNat, FtsoManager) |
| **Flare Data Availability API** | Historical anchor prices for 24h change calculations |
| **Coston2 Testnet** | Public deployment for reproducible judging |

## What Was Newly Built / Improved

During the hackathon program:

- **Multi-asset bearer-note escrow** — `BearerNoteEscrow.sol` accepts any allowlisted ERC-20 (not just a single stablecoin), with per-asset denomination bounds enforced by `AssetRegistry.sol`.
- **Partial redemption with issuer refund** — merchants redeem only what they need; the remainder is sent back to the original issuer in the same transaction.
- **Commit-reveal front-running protection** — redemption requires a per-merchant, per-note, per-amount commitment that must mature by one block before the secret is revealed.
- **Pause controls** — owner can pause minting and redemption in emergencies; cancellation remains available.
- **SafeERC20 + fee-on-transfer protection** — escrow verifies actual received amounts, rejecting tokens with unexpected transfer fees.
- **9 contract tests** — mint, full redeem, partial redeem, front-running prevention, amount-tampering prevention, replay prevention, cancellation, pause, and unsupported-asset rejection.
- **Live FTSOv2 integration** — migrated to official Flare FTSOv2 protocol contracts via the Contract Registry, with FeeCalculator and Data Availability API for historical anchor prices.
- **Multi-asset ATM UI** — asset selector, per-asset balance display, QR payload with asset metadata, and redemption asset selection.
- **Interactive charts** — crosshair tooltips, LIVE/24H range, AREA/LINE modes, MA5 overlay, time-proportional plotting.
- **Responsive terminal UI** — drag-and-drop panel layout, light/dark theme, token logos, performance-optimized lazy loading.

## Smart Contract Addresses (Coston2)

| Contract | Address | Status |
|---|---|---|
| AssetRegistry | `0xf869F7b8a288229A2AE944CB43E462617183B6c6` | Deployed |
| BearerNoteEscrow | `0x9A96CB8C12AbB76757c459E6F2F21caB13Cd184d` | Deployed |
| StableCoin (FLRD) | `0x374fb73CC8a40167D3D393223B1AF82ac2A26A10` | Deployed |
| FXRP (Flare FAsset) | `0x0b6A3645c240605887a5532109323A3E12273dc7` | Official Flare contract (FTestXRP) |

**Network:** Coston2 Testnet (Chain ID: 114)
**RPC:** `https://coston2-api.flare.network/ext/bc/C/rpc`
**Explorer:** `https://coston2-explorer.flare.network`

## Architecture

### Smart Contracts (`/contracts`)

- **`AssetRegistry.sol`** — Owner-managed allowlist of supported ERC-20 assets with per-asset minimum/maximum note value bounds.
- **`BearerNoteEscrow.sol`** — Immutable core: mint, commit-reveal redeem (with partial redemption and issuer refund), cancel, pause.
- **`StableCoin.sol`** — ERC-20 test token (FLRD) with faucet for demo purposes.
- **`TestToken.sol`** — Generic ERC-20 used in contract tests.
- **`MockFTSO.sol`** — Mock price feed for local testing (legacy).

### Frontend (`/src`)

- **Next.js 14** with App Router, **Tailwind CSS**, **ethers.js v6**
- `useFTSO` — Live FTSOv2 price feed hook (Contract Registry → FtsoV2 → FeeCalculator)
- `useATM` — Multi-asset banknote mint/redeem with on-chain transactions
- `useWallet` — EIP-6963 wallet connection with Coston2 network switching
- `ATMPanel` — Skeuomorphic ATM with asset selector and QR banknote dispensing

### Tests (`/test`)

- `BearerNoteEscrow.ts` — 9 tests covering all critical escrow flows

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Add your PRIVATE_KEY (Coston2 funded)
# FXRP address is pre-filled for Coston2
```

### 3. Deploy Contracts (Coston2)
```bash
npm run deploy
# Copy output addresses into .env
```

### 4. Run the Terminal
```bash
npm run dev
```
Open http://localhost:3000

### 5. Run Tests
```bash
npm test
```

## Usage

1. **Connect Wallet** — Click "INSERT CARD" on the ATM or type `CONNECT` in the command line
2. **Get FLRD** — Use the faucet to claim 1,000 test FLRD tokens
3. **Get FXRP** — Visit the [Coston2 Faucet](https://faucet.flare.network/) for 10 FXRP per 24h
4. **Withdraw Banknotes** — Select an asset (FLRD or FXRP), choose a denomination, mint a QR banknote
5. **Print/Share** — The banknote QR code can be printed or shared
6. **Redeem** — A merchant pastes the QR payload, commits, waits one block, and redeems

## Feature Status

| Feature | Status |
|---|---|
| Multi-asset bearer notes (FLRD + FXRP) | Live on Coston2 |
| Partial redemption with issuer refund | Live |
| Commit-reveal front-running protection | Live |
| FTSOv2 live price feeds (57+ assets) | Live |
| Interactive charts | Live |
| Wallet connection (EIP-6963) | Live |
| FAssets mint/redeem via official Asset Manager | Roadmap |
| DEX swap integration | Roadmap |
| Governance (on-chain) | Roadmap |
| Flare Confidential Compute extension | Roadmap |

## Roadmap

1. Integrate official FAssets Asset Manager for direct mint/redeem flows
2. Add more supported FAssets (fBTC, fDOGE, fLTC, fXLM)
3. Production asset policy with multisig administration (Safe + OZ roles)
4. Merchant pilot program and user feedback collection
5. Explore Flare Confidential Compute extension for private settlement authorization
6. External security audit before Flare mainnet deployment

## License

MIT
