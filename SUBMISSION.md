# Flare Summer Signal — Submission

## Project Name
Flare Terminal — Interoperable Bearer Notes

## Selected Bounty
Bounty 1 — Interoperable Asset Products

## Short Product Description
Flare Terminal turns interoperable assets on Flare into programmable digital cash. Users lock supported ERC-20 assets (FLRD stablecoin or FXRP) into on-chain bearer notes via a skeuomorphic ATM interface, share them through printable QR codes, and let any recipient redeem the value with a Flare wallet. Notes support partial merchant redemption — unused value is automatically returned to the issuer in the same transaction.

## Target User
Crypto users and merchants who want to transfer interoperable assets through a familiar cash-like experience without copying addresses or navigating DeFi interfaces. Especially suited for in-person payments, gifts, vouchers, events, and low-friction merchant settlement.

## Demo Link
Live app: http://localhost:3001 (run `npm run dev` from the repo)
Video demo: [to be recorded]

## GitHub Repo
https://github.com/EcosystemNetwork/FlareTerminal (branch: `flare-terminal-v2`)

## How the Project Uses Flare

| Flare Component | Usage |
|---|---|
| **Flare C-chain (Coston2)** | Bearer-note escrow, settlement, and token transfers |
| **FAssets / FXRP (FTestXRP)** | Interoperable asset used as note collateral — the official Flare FTestXRP ERC-20 token at `0x0b6A3645c240605887a5532109323A3E12273dc7` |
| **FTSOv2** | Live decentralized price feeds for 57+ assets via Flare's Contract Registry (`0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019`), FtsoV2 (`0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d`), and FeeCalculator (`0x88A9315f96c9b5518BBeC58dC6a914e13fAb13e2`) |
| **Flare Data Availability API** | Historical anchor prices from `https://ctn2-data-availability.flare.network/api/v0` for 24h change calculations |
| **Coston2 Testnet** | Public deployment for reproducible judging (Chain ID: 114) |

## What Was Newly Built / Improved During the Program

### Smart Contracts (new)
- **AssetRegistry.sol** — Owner-managed allowlist of supported ERC-20 assets with per-asset minimum/maximum note value bounds
- **BearerNoteEscrow.sol** — Multi-asset commit-reveal escrow with:
  - Partial redemption (merchant gets requested amount, issuer gets remainder)
  - Commit-reveal front-running protection (per-merchant, per-note, per-amount commitment, must mature by one block)
  - Pause controls (owner can pause minting/redemption; cancellation always available)
  - SafeERC20 with fee-on-transfer protection
  - Note expiry support
  - Cancel-with-secret for issuers
- **9 adversarial contract tests** covering: mint, full redeem, partial redeem with issuer refund, front-running prevention, amount-tampering prevention, replay/double-redemption prevention, cancellation, pause enforcement, and unsupported-asset rejection

### Frontend (new/improved)
- **Multi-asset ATM** — Asset selector (FLRD or FXRP), per-asset balance display, QR banknote with asset metadata, redemption asset selection
- **Live FTSOv2 integration** — Migrated to official Flare FTSOv2 protocol contracts via Contract Registry, with FeeCalculator for payable feed calls and Data Availability API for 24h anchor prices
- **Interactive charts** — Crosshair tooltips, LIVE/24H range, AREA/LINE modes, MA5 overlay, time-proportional plotting, 500-point history depth
- **Real block-wait for redemption** — Redeem waits for an actual new Coston2 block instead of a fixed timeout
- **DemoBanner wrappers** — All simulated panels (Governance, FAssets, Swap, FlareDrop, Staking, NFT) wrapped in visible `[LABS · SIMULATION]` banners so judges are never misled
- **Multi-asset wallet** — Real C2FLR + FLRD + FXRP balances with FTSO pricing and USD values
- **Responsive terminal UI** — Drag-and-drop panel layout, light/dark theme, token logos, lazy-loaded panels

### Truthfulness improvements
- Removed fake trade execution logs
- Removed mock faucet fallback
- Simulated modules clearly marked with `[LABS · SIMULATION]` banners

## Smart Contract Addresses (Coston2)

| Contract | Address | Status |
|---|---|---|
| AssetRegistry | `0xf869F7b8a288229A2AE944CB43E462617183B6c6` | Deployed & verified |
| BearerNoteEscrow | `0x9A96CB8C12AbB76757c459E6F2F21caB13Cd184d` | Deployed & verified |
| StableCoin (FLRD) | `0x374fb73CC8a40167D3D393223B1AF82ac2A26A10` | Deployed |
| FTestXRP (official Flare FAsset) | `0x0b6A3645c240605887a5532109323A3E12273dc7` | Official Flare contract |

**Network:** Coston2 Testnet (Chain ID: 114)
**RPC:** `https://coston2-api.flare.network/ext/bc/C/rpc`
**Explorer:** `https://coston2-explorer.flare.network`

## Deployment
- Deployed on **Coston2** testnet
- All contracts verified on-chain (bytecode confirmed via RPC)
- FXRP (FTestXRP) is the official Flare FAsset token on Coston2, allowlisted in our AssetRegistry

## Roadmap / Next Steps
1. Integrate official FAssets Asset Manager for direct mint/redeem flows (currently using faucet-obtained FXRP)
2. Add more supported FAssets (fBTC, fDOGE, fLTC, fXLM) as they become available
3. Production asset policy with Safe multisig + OpenZeppelin roles
4. Merchant pilot program and user feedback collection
5. Explore Flare Confidential Compute extension for private settlement authorization
6. External security audit before Flare mainnet deployment

## Traction Signals
- Built during Flare Summer Signal hackathon
- Deployed and tested on Coston2 with real transactions
- 9 passing contract tests covering all critical escrow flows
- Production build passes (198 kB page, 286 kB first-load JS)
