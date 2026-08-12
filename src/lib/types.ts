export interface PriceFeed {
  symbol: string;
  feedId: string;
  price: number;
  change24h: number;
  timestamp: number;
  decimals: number;
  source: "FTSOv2";
}

export interface Banknote {
  noteId: number;
  denomination: number;
  secretHash: string;
  owner: string;
  redeemed: boolean;
  createdAt: number;
}

export interface Transaction {
  hash: string;
  type: "mint" | "redeem" | "transfer" | "faucet" | "cancel";
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  details: string;
}

export interface WalletState {
  address: string | null;
  balance: number;
  isConnected: boolean;
}

export type PanelType =
  | "market" | "atm" | "trading" | "portfolio" | "transactions"
  | "help" | "delegation" | "alerts"
  | "transfer" | "governance" | "fassets" | "flaredrop" | "staking"
  | "epochs" | "explorer" | "nft" | "swap";

export type PanelId = PanelType | "command";

export interface LayoutColumn {
  id: string;
  panels: PanelId[];
  activeIndex: number;
}

export interface TerminalLayoutState {
  columns: LayoutColumn[];
}

export interface DragData {
  panelId: PanelId;
  fromColumnId: string;
  fromIndex: number;
}

export interface PanelMeta {
  id: PanelId;
  label: string;
  fnKey: string;
  closable: boolean;
}
