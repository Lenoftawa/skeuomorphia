import type { PanelId, PanelMeta } from "./types";

export const PANEL_META: Record<PanelId, PanelMeta> = {
  market:       { id: "market",       label: "MARKET DATA",  fnKey: "F1", closable: true  },
  atm:          { id: "atm",          label: "ATM",          fnKey: "F2", closable: true  },
  trading:      { id: "trading",      label: "TRADE",        fnKey: "F3", closable: true  },
  portfolio:    { id: "portfolio",    label: "WALLET",       fnKey: "F4", closable: true  },
  transactions: { id: "transactions", label: "TX LOG",       fnKey: "F5", closable: true  },
  help:         { id: "help",         label: "HELP",         fnKey: "F6", closable: true  },
  delegation:   { id: "delegation",   label: "DELEGATION",   fnKey: "F7", closable: true  },
  alerts:       { id: "alerts",       label: "ALERTS",       fnKey: "F8", closable: true  },
  transfer:     { id: "transfer",     label: "TRANSFER",     fnKey: "",   closable: true  },
  governance:   { id: "governance",   label: "GOVERNANCE",   fnKey: "",   closable: true  },
  fassets:      { id: "fassets",      label: "F-ASSETS",     fnKey: "",   closable: true  },
  flaredrop:    { id: "flaredrop",    label: "FLAREDROP",    fnKey: "",   closable: true  },
  staking:      { id: "staking",      label: "rFLR STAKING", fnKey: "",   closable: true  },
  epochs:       { id: "epochs",       label: "EPOCH EXPLR",  fnKey: "",   closable: true  },
  explorer:     { id: "explorer",     label: "EXPLORER",     fnKey: "",   closable: true  },
  nft:          { id: "nft",          label: "NFT GALLERY",  fnKey: "",   closable: true  },
  swap:         { id: "swap",         label: "DEX SWAP",     fnKey: "",   closable: true  },
  command:      { id: "command",      label: "COMMAND",      fnKey: "",   closable: false },
};

export const ALL_PANEL_IDS: PanelId[] = [
  "market", "atm", "trading", "portfolio", "transactions", "help",
  "delegation", "alerts",
  "transfer", "governance", "fassets", "flaredrop", "staking",
  "epochs", "explorer", "nft", "swap",
  "command",
];

export const DEFAULT_LAYOUT = {
  columns: [
    { id: "col-left",   panels: ["market"] as PanelId[],               activeIndex: 0 },
    { id: "col-center", panels: ["atm"] as PanelId[],                  activeIndex: 0 },
    { id: "col-right",  panels: ["portfolio", "command"] as PanelId[], activeIndex: 0 },
  ],
};
