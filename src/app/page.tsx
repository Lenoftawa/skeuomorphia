"use client";

import { memo, useState, useCallback, useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { TickerTape } from "@/components/TickerTape";
import { FunctionBar } from "@/components/FunctionBar";
import { TerminalLayout, useTerminalLayout } from "@/components/TerminalLayout";

function PanelLoading() {
  return <div className="terminal-panel terminal-panel-grad h-full p-3 text-xs text-terminal-amber animate-pulse">LOADING MODULE...</div>;
}

const MarketData = dynamic(() => import("@/components/MarketData").then((module) => module.MarketData), { loading: PanelLoading });
const ATMPanel = dynamic(() => import("@/components/ATMPanel").then((module) => module.ATMPanel), { loading: PanelLoading });
const TradingPanel = dynamic(() => import("@/components/TradingPanel").then((module) => module.TradingPanel), { loading: PanelLoading });
const Portfolio = dynamic(() => import("@/components/Portfolio").then((module) => module.Portfolio), { loading: PanelLoading });
const TransactionsPanel = dynamic(() => import("@/components/TransactionsPanel").then((module) => module.TransactionsPanel), { loading: PanelLoading });
const CommandLine = dynamic(() => import("@/components/CommandLine").then((module) => module.CommandLine), { loading: PanelLoading });
const DelegationPanel = dynamic(() => import("@/components/DelegationPanel").then((module) => module.DelegationPanel), { loading: PanelLoading });
const PriceAlertsPanel = dynamic(() => import("@/components/PriceAlertsPanel").then((module) => module.PriceAlertsPanel), { loading: PanelLoading });
const TransferPanel = dynamic(() => import("@/components/TransferPanel").then((module) => module.TransferPanel), { loading: PanelLoading });
const GovernancePanel = dynamic(() => import("@/components/GovernancePanel").then((module) => module.GovernancePanel), { loading: PanelLoading });
const FAssetsPanel = dynamic(() => import("@/components/FAssetsPanel").then((module) => module.FAssetsPanel), { loading: PanelLoading });
const FlareDropPanel = dynamic(() => import("@/components/FlareDropPanel").then((module) => module.FlareDropPanel), { loading: PanelLoading });
const StakingPanel = dynamic(() => import("@/components/StakingPanel").then((module) => module.StakingPanel), { loading: PanelLoading });
const EpochExplorerPanel = dynamic(() => import("@/components/EpochExplorerPanel").then((module) => module.EpochExplorerPanel), { loading: PanelLoading });
const ExplorerPanel = dynamic(() => import("@/components/ExplorerPanel").then((module) => module.ExplorerPanel), { loading: PanelLoading });
const NFTGalleryPanel = dynamic(() => import("@/components/NFTGalleryPanel").then((module) => module.NFTGalleryPanel), { loading: PanelLoading });
const SwapPanel = dynamic(() => import("@/components/SwapPanel").then((module) => module.SwapPanel), { loading: PanelLoading });
import { useWallet } from "@/hooks/useWallet";
import { useFTSO, type PriceHistory } from "@/hooks/useFTSO";
import { useATM } from "@/hooks/useATM";
import { useDelegation } from "@/hooks/useDelegation";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useTransfer } from "@/hooks/useTransfer";
import { useGovernance } from "@/hooks/useGovernance";
import { useFAssets } from "@/hooks/useFAssets";
import { useFlareDrop } from "@/hooks/useFlareDrop";
import { useStaking } from "@/hooks/useStaking";
import { useEpochs } from "@/hooks/useEpochs";
import { useExplorer } from "@/hooks/useExplorer";
import { useNFTs } from "@/hooks/useNFTs";
import { useSwap } from "@/hooks/useSwap";
import type { PanelId, PriceFeed } from "@/lib/types";
import { FLARE_FOCUS_SYMBOLS } from "@/lib/flare";

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

const PanelRenderer = memo(function PanelRenderer({ panelId, state }: { panelId: PanelId; state: SharedState }) {
  const { focusPanel, addColumn, resetLayout } = useTerminalLayout();
  const { prices, focusPrices, loading, priceError, history, focusHistory, wallet, atm, delegation, alerts, transfer, governance, fassets, flaredrop, staking, epochs, explorer, nfts, swap, onPrint } = state;

  const handleCommand = useCallback(
    (cmd: string): string => {
      switch (cmd) {
        case "HELP":
          return `AVAILABLE COMMANDS:
  HELP       - Show this help
  CONNECT    - Connect wallet
  ATM        - Switch to ATM panel
  TRADE      - Switch to trading panel
  MARKET     - Switch to market data
  PORTFOLIO  - View portfolio
  DELEGATE   - FTSO delegation panel
  ALERTS     - Price alerts panel
  TRANSFER   - Send FLR/FLRD
  GOVERNANCE - View & vote on proposals
  FASSETS    - F-Asset minting/redeeming
  FLAREDROP  - Claim FlareDrop rewards
  STAKING    - rFLR staking panel
  EPOCHS     - FTSO epoch explorer
  EXPLORER   - On-chain tx history
  NFT        - NFT gallery
  SWAP       - DEX swap panel
  FAUCET     - Claim 1000 FLRD
  ADDCOL     - Add a new column to layout
  RESET      - Reset layout to default
  CLEAR      - Clear terminal
  ABOUT      - About Flare Terminal`;
        case "CONNECT":
          wallet.connect();
          return "Connecting wallet...";
        case "ATM":
          focusPanel("atm");
          return "Switched to ATM panel";
        case "TRADE":
          focusPanel("trading");
          return "Switched to trading panel";
        case "MARKET":
          focusPanel("market");
          return "Switched to market data";
        case "PORTFOLIO":
          focusPanel("portfolio");
          return "Switched to portfolio";
        case "DELEGATE":
          focusPanel("delegation");
          return "Switched to delegation panel";
        case "ALERTS":
          focusPanel("alerts");
          return "Switched to price alerts";
        case "TRANSFER":
          focusPanel("transfer");
          return "Switched to transfer panel";
        case "GOVERNANCE":
          focusPanel("governance");
          return "Switched to governance panel";
        case "FASSETS":
          focusPanel("fassets");
          return "Switched to F-Assets panel";
        case "FLAREDROP":
          focusPanel("flaredrop");
          return "Switched to FlareDrop panel";
        case "STAKING":
          focusPanel("staking");
          return "Switched to staking panel";
        case "EPOCHS":
          focusPanel("epochs");
          return "Switched to epoch explorer";
        case "EXPLORER":
          focusPanel("explorer");
          return "Switched to block explorer";
        case "NFT":
          focusPanel("nft");
          return "Switched to NFT gallery";
        case "SWAP":
          focusPanel("swap");
          return "Switched to DEX swap";
        case "FAUCET":
          if (wallet.isConnected) {
            wallet.claimFaucet();
            return "Claiming 1000 FLRD from faucet...";
          }
          return "ERROR: Wallet not connected. Run CONNECT first.";
        case "ABOUT":
          return `FLARE TERMINAL
Bloomberg-style trading interface with skeuomorphic ATM
Built for Flare Summer Signal Hackathon
Network: Flare Coston2 Testnet
Contracts: StableCoin (FLRD) + CashEscrow + FTSO`;
        case "ADDCOL":
          addColumn();
          return "Column added.";
        case "RESET":
          resetLayout();
          return "Layout reset to default.";
        case "CLEAR":
          return "";
        default:
          return `UNKNOWN COMMAND: ${cmd}\nType HELP for available commands.`;
      }
    },
    [wallet, focusPanel, addColumn, resetLayout]
  );

  switch (panelId) {
    case "market":
      return <MarketData prices={focusPrices} loading={loading} error={priceError} history={focusHistory} />;
    case "atm":
      return (
        <ATMPanel
          isConnected={wallet.isConnected}
          address={wallet.address}
          balances={atm.balances}
          busy={atm.busy}
          error={atm.error}
          faucetPending={wallet.faucetPending}
          faucetError={wallet.error}
          lastNoteQR={atm.lastNoteQR}
          lastNoteId={atm.lastNoteId}
          lastNoteSecret={atm.lastNoteSecret}
          lastNoteAsset={atm.lastNoteAsset}
          onConnect={wallet.connect}
          onFaucet={wallet.claimFaucet}
          onMint={atm.mintBanknote}
          onRedeem={atm.redeemBanknote}
          onPrint={onPrint}
        />
      );
    case "trading":
      return (
        <TradingPanel
          prices={prices}
          balance={wallet.balance}
          isConnected={wallet.isConnected}
          history={history}
          signer={wallet.signer}
        />
      );
    case "portfolio":
      return (
        <Portfolio
          address={wallet.address}
          balance={wallet.balance}
          nativeBalance={wallet.nativeBalance}
          assetBalances={wallet.assetBalances}
          prices={prices}
          isConnected={wallet.isConnected}
          onFaucet={wallet.claimFaucet}
          transactions={atm.transactions}
        />
      );
    case "transactions":
      return (
        <TransactionsPanel
          address={wallet.address}
          isConnected={wallet.isConnected}
          transactions={atm.transactions}
        />
      );
    case "help":
      return <HelpPanel />;
    case "delegation":
      return (
        <DelegationPanel
          isConnected={wallet.isConnected}
          address={wallet.address}
          delegation={delegation}
          onConnect={wallet.connect}
        />
      );
    case "alerts":
      return <PriceAlertsPanel prices={prices} alerts={alerts} />;
    case "transfer":
      return (
        <TransferPanel
          isConnected={wallet.isConnected}
          address={wallet.address}
          balance={wallet.balance}
          transfer={transfer}
          onConnect={wallet.connect}
        />
      );
    case "governance":
      return (
        <GovernancePanel
          isConnected={wallet.isConnected}
          governance={governance}
          onConnect={wallet.connect}
        />
      );
    case "fassets":
      return (
        <FAssetsPanel
          isConnected={wallet.isConnected}
          fassets={fassets}
          onConnect={wallet.connect}
        />
      );
    case "flaredrop":
      return (
        <FlareDropPanel
          isConnected={wallet.isConnected}
          flaredrop={flaredrop}
          onConnect={wallet.connect}
        />
      );
    case "staking":
      return (
        <StakingPanel
          isConnected={wallet.isConnected}
          staking={staking}
          onConnect={wallet.connect}
        />
      );
    case "epochs":
      return <EpochExplorerPanel epochs={epochs} />;
    case "explorer":
      return (
        <ExplorerPanel
          isConnected={wallet.isConnected}
          address={wallet.address}
          explorer={explorer}
          onConnect={wallet.connect}
        />
      );
    case "nft":
      return (
        <NFTGalleryPanel
          isConnected={wallet.isConnected}
          address={wallet.address}
          nfts={nfts}
          onConnect={wallet.connect}
        />
      );
    case "swap":
      return (
        <SwapPanel
          isConnected={wallet.isConnected}
          swap={swap}
          onConnect={wallet.connect}
        />
      );
    case "command":
      return <CommandLine onCommand={handleCommand} />;
    default:
      return null;
  }
});

function HelpPanel() {
  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>HELP // ABOUT</span>
      </div>
      <div className="terminal-content flex-1 overflow-auto text-xs space-y-3">
        <div>
          <div className="text-terminal-amber font-bold mb-1">FLARE TERMINAL</div>
          <div className="text-terminal-white-dim">
            Flare Terminal is a Bloomberg-style trading interface with a skeuomorphic ATM for Flare Network.
          </div>
        </div>
        <div>
          <div className="text-terminal-amber mb-1">FEATURES</div>
          <div className="text-terminal-white">
            - Real-time FTSO price feeds from Flare Network (57 assets)<br />
            - Skeuomorphic ATM for withdrawing digital banknotes<br />
            - Cash escrow with commit-reveal front-running protection<br />
            - Trading panel with FLRD pairs + live price charts<br />
            - Transaction log and portfolio tracking<br />
            - <span className="text-terminal-amber">FTSO Delegation</span> (F7): Wrap FLR, delegate to data providers, claim rewards<br />
            - <span className="text-terminal-amber">Price Alerts</span> (F8): Set threshold alerts on any FTSO asset<br />
            - <span className="text-terminal-amber">Token Transfer</span>: Send FLR or FLRD to any address<br />
            - <span className="text-terminal-amber">Governance</span>: View and vote on Flare Improvement Proposals<br />
            - <span className="text-terminal-amber">F-Assets</span>: Mint/redeem wrapped L1 assets (fBTC, fXRP, fDOGE...)<br />
            - <span className="text-terminal-amber">FlareDrop</span>: Claim monthly FLR distribution rewards<br />
            - <span className="text-terminal-amber">rFLR Staking</span>: Stake FLR via RNat for yield rewards<br />
            - <span className="text-terminal-amber">Epoch Explorer</span>: FTSO epoch info + data provider stats<br />
            - <span className="text-terminal-amber">Block Explorer</span>: On-chain transaction history from Flare explorer<br />
            - <span className="text-terminal-amber">NFT Gallery</span>: View NFTs in connected wallet<br />
            - <span className="text-terminal-amber">DEX Swap</span>: FTSO-priced token swaps<br />
            - Command line interface (type HELP)<br />
            - <span className="text-terminal-amber">Customizable layout</span>:<br />
            &nbsp;&nbsp;• Drag tabs between columns to rearrange panels<br />
            &nbsp;&nbsp;• Click [+] on any tab bar to add panels<br />
            &nbsp;&nbsp;• Click [×] on empty column to remove it<br />
            &nbsp;&nbsp;• Press F10 or click [+COL] to add a new column<br />
            &nbsp;&nbsp;• Press F9 or type RESET to restore default layout<br />
            &nbsp;&nbsp;• Layout persists across sessions
          </div>
        </div>
        <div>
          <div className="text-terminal-amber mb-1">SMART CONTRACTS</div>
          <div className="text-terminal-white">
            - StableCoin (FLRD): ERC20 with faucet<br />
            - CashEscrow: Banknote minting & redemption<br />
            - MockFTSO: Price feed simulation
          </div>
        </div>
        <div>
          <div className="text-terminal-amber mb-1">NETWORK</div>
          <div className="text-terminal-white">
            Flare Coston2 Testnet (Chain ID: 114)<br />
            RPC: https://coston2-api.flare.network/ext/bc/C/rpc
          </div>
        </div>
        <div>
          <div className="text-terminal-amber mb-1">HACKATHON</div>
          <div className="text-terminal-white">
            Built for Flare Summer Signal Hackathon<br />
            GitHub: Flare Terminal
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("flare-terminal-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const initialTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : preferredTheme;
    document.documentElement.dataset.theme = initialTheme;
    setTheme(initialTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem("flare-terminal-theme", nextTheme);
      return nextTheme;
    });
  }, []);

  return (
    <button
      type="button"
      className="theme-toggle flex-shrink-0"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "light"}
    >
      THEME: {theme.toUpperCase()}
    </button>
  );
}

function TerminalClock() {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString());
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-terminal-white-dim tabular-nums">{clock}</span>;
}

export default function TerminalPage() {
  const wallet = useWallet();
  const { prices, loading, error: priceError, history: priceHistory } = useFTSO(5000);
  const focusSymbolSet = new Set<string>(FLARE_FOCUS_SYMBOLS);
  const focusPrices = prices.filter((feed) => focusSymbolSet.has(feed.symbol));
  const focusHistory: PriceHistory = Object.fromEntries(
    Object.entries(priceHistory).filter(([symbol]) => focusSymbolSet.has(symbol))
  );
  const atm = useATM(wallet.signer);
  const delegation = useDelegation(wallet.signer, wallet.address);
  const alerts = usePriceAlerts(prices);
  const transfer = useTransfer(wallet.signer);
  const governance = useGovernance(wallet.signer, wallet.address);
  const fassets = useFAssets(prices, wallet.address);
  const flaredrop = useFlareDrop(wallet.signer, wallet.address);
  const staking = useStaking(wallet.signer, wallet.address);
  const epochs = useEpochs();
  const explorer = useExplorer();
  const nfts = useNFTs(wallet.address);
  const swap = useSwap(prices, wallet.signer);

  useEffect(() => {
    if (wallet.isConnected) {
      atm.refreshBalances();
    }
  }, [wallet.isConnected, atm]);

  const handlePrint = useCallback(() => {
    if (atm.lastNoteQR) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <html>
            <head><title>Flare Bank Note #${atm.lastNoteId}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; }
              .note { border: 3px solid #2a5a2a; border-radius: 12px; padding: 30px; text-align: center; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); max-width: 400px; }
              .denom { font-size: 48px; font-weight: bold; color: #1b5e20; }
              .label { font-size: 12px; color: #2e7d32; }
              img { margin: 15px auto; }
              .id { font-size: 10px; color: #555; }
            </style>
            </head>
            <body>
              <div class="note">
                <div class="label">FLARE BANK</div>
                <div class="denom">${atm.lastNoteAsset || "NOTE"}</div>
                <img src="${atm.lastNoteQR}" width="200" height="200" />
                <div class="id">NOTE ID: ${atm.lastNoteId}</div>
                <div class="label">SCAN QR TO REDEEM</div>
              </div>
              <script>window.print()</script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  }, [atm.lastNoteQR, atm.lastNoteId, atm.lastNoteAsset]);

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

  const renderPanel = useCallback(
    (panelId: PanelId): ReactNode => (
      <PanelRenderer panelId={panelId} state={sharedState} />
    ),
    [sharedState]
  );

  return (
    <div className="terminal-page h-[100dvh] flex flex-col bg-terminal-bg grid-bg">
      {/* Top Status Bar */}
      <div className="top-status-bar status-bar min-h-9 flex items-center px-3 text-[10px] gap-3 overflow-x-auto whitespace-nowrap flex-shrink-0">
        <span className="text-terminal-amber font-bold glow-amber tracking-wider">◈ FLARE TERMINAL</span>
        <span className="text-terminal-white-faint">│</span>
        <span className="text-terminal-green flex items-center">
          <span className="status-led led-green" />COSTON2
        </span>
        <span className="text-terminal-white-faint">│</span>
        <span className="text-terminal-white">
          {wallet.isConnected
            ? <span className="text-terminal-cyan glow-cyan">{wallet.address?.slice(0, 8)}...{wallet.address?.slice(-4)}</span>
            : <span className="text-terminal-amber">WALLET: STANDBY</span>}
        </span>
        {wallet.isConnected && (
          <>
            <span className="text-terminal-white-faint">│</span>
            <span className="text-terminal-amber">{wallet.balance.toFixed(2)} FLRD</span>
          </>
        )}
        {prices.length > 0 && (
          <>
            <span className="text-terminal-white-faint">│</span>
            <span className="text-terminal-white-dim">{prices.length} FTSOv2 FEEDS</span>
          </>
        )}
        <span className="flex-1" />
        <ThemeToggle />
        <TerminalClock />
        <span className="text-terminal-white-faint">│</span>
        <span className="text-terminal-amber-dim">v1.0.0</span>
      </div>

      {/* Ticker Tape */}
      <TickerTape prices={focusPrices} />

      {/* Main Terminal Layout — draggable, composable panels */}
      <TerminalLayout
        renderPanel={renderPanel}
        footer={<FunctionBar />}
      />
    </div>
  );
}
