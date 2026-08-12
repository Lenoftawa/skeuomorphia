"use client";

import { useEffect } from "react";
import { useTerminalLayout } from "./TerminalLayout";
import type { PanelId } from "@/lib/types";

const FUNCTION_KEYS: { key: string; label: string; panel: PanelId; action?: "reset" | "addcol" }[] = [
  { key: "F1", label: "MARKET",    panel: "market" },
  { key: "F2", label: "ATM",       panel: "atm" },
  { key: "F3", label: "TRADE",     panel: "trading" },
  { key: "F4", label: "WALLET",    panel: "portfolio" },
  { key: "F5", label: "TX LOG",    panel: "transactions" },
  { key: "F6", label: "HELP",      panel: "help" },
  { key: "F7", label: "DELEGATE",  panel: "delegation" },
  { key: "F8", label: "ALERTS",    panel: "alerts" },
  { key: "F9", label: "TRANSFER",  panel: "transfer" },
  { key: "F10",label: "GOVERN",    panel: "governance" },
  { key: "F11",label: "F-ASSETS",  panel: "fassets" },
  { key: "F12",label: "FLAREDROP", panel: "flaredrop" },
];

const SECONDARY_KEYS: { key: string; label: string; panel: PanelId; action?: "reset" | "addcol" }[] = [
  { key: "S+1", label: "STAKING",   panel: "staking" },
  { key: "S+2", label: "EPOCHS",    panel: "epochs" },
  { key: "S+3", label: "EXPLORER",  panel: "explorer" },
  { key: "S+4", label: "NFT",       panel: "nft" },
  { key: "S+5", label: "SWAP",      panel: "swap" },
  { key: "S+R", label: "RESET",     panel: "help", action: "reset" },
  { key: "S+C", label: "+ COL",     panel: "help", action: "addcol" },
];

export function FunctionBar() {
  const { focusPanel, resetLayout, addColumn } = useTerminalLayout();

  const handleKey = (fn: typeof FUNCTION_KEYS[number]) => {
    if (fn.action === "reset") resetLayout();
    else if (fn.action === "addcol") addColumn();
    else focusPanel(fn.panel);
  };

  // Global F1–F12 + Shift+<key> handlers so the function bar works without focus.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't hijack keys while typing in inputs/textareas.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const all = [...FUNCTION_KEYS, ...SECONDARY_KEYS];
      for (const fn of all) {
        if (fn.key.startsWith("F")) {
          // F1..F12
          if (e.key === fn.key) {
            e.preventDefault();
            handleKey(fn);
            return;
          }
        } else if (fn.key.startsWith("S+")) {
          // Shift + <char>
          const ch = fn.key.slice(2);
          if (e.shiftKey && (e.key === ch || e.key.toUpperCase() === ch)) {
            e.preventDefault();
            handleKey(fn);
            return;
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav className="function-bar min-h-12 status-bar border-b border-terminal-border flex items-center gap-1 px-2 py-1 overflow-x-auto" aria-label="Terminal navigation">
      <div className="flex items-center gap-1 flex-shrink-0">
        {FUNCTION_KEYS.map((fn) => (
          <button
            key={fn.key}
            className="fn-key flex-shrink-0"
            onClick={() => handleKey(fn)}
          >
            <div className="text-[7px] text-terminal-white-faint">{fn.key}</div>
            <div className="font-bold text-[9px]">{fn.label}</div>
          </button>
        ))}
      </div>
      <div className="w-px h-5 bg-terminal-border flex-shrink-0" />
      <div className="flex items-center gap-1 flex-shrink-0">
        {SECONDARY_KEYS.map((fn) => (
          <button
            key={fn.key}
            className="fn-key flex-shrink-0"
            onClick={() => handleKey(fn)}
          >
            <div className="text-[7px] text-terminal-white-faint">{fn.key}</div>
            <div className="font-bold text-[9px]">{fn.label}</div>
          </button>
        ))}
      </div>
    </nav>
  );
}
