"use client";

import { useState, useEffect, useRef } from "react";
import { DENOMINATIONS, SUPPORTED_ASSETS, type SupportedAsset } from "@/lib/flare";
import { formatTokenAmount, shortenAddress } from "@/lib/atm";
import { DEPLOYED_ADDRESSES } from "@/lib/contracts";
import { TokenLogo } from "./TokenLogo";

interface ATMPanelProps {
  isConnected: boolean;
  address: string | null;
  balances: Record<string, number>;
  busy: boolean;
  error: string | null;
  faucetPending: boolean;
  faucetError: string | null;
  lastNoteQR: string | null;
  lastNoteId: number | null;
  lastNoteSecret: string | null;
  lastNoteAsset: string | null;
  onConnect: () => void;
  onFaucet: () => void;
  onMint: (asset: SupportedAsset, denomination: number) => void;
  onRedeem: (noteId: number, secret: string, amount: number, assetSymbol: string, assetDecimals: number) => void;
  onPrint: () => void;
}

type ATMState =
  | "idle" | "auth" | "menu" | "asset-select" | "withdraw" | "processing"
  | "dispense" | "done" | "redeem" | "redeem-processing" | "redeem-done";

export function ATMPanel({
  isConnected,
  address,
  balances,
  busy,
  error,
  faucetPending,
  faucetError,
  lastNoteQR,
  lastNoteId,
  lastNoteSecret,
  lastNoteAsset,
  onConnect,
  onFaucet,
  onMint,
  onRedeem,
  onPrint,
}: ATMPanelProps) {
  const [atmState, setAtmState] = useState<ATMState>("idle");
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>(SUPPORTED_ASSETS[0]);
  const [selectedDenom, setSelectedDenom] = useState<number | null>(null);
  const [redeemNoteId, setRedeemNoteId] = useState("");
  const [redeemSecret, setRedeemSecret] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemAssetSymbol, setRedeemAssetSymbol] = useState("");
  const [redeemAssetDecimals, setRedeemAssetDecimals] = useState(6);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState("");
  const [showQrInput, setShowQrInput] = useState(false);
  const mintStartedRef = useRef(false);
  const redeemStartedRef = useRef(false);

  const handleConnect = () => {
    onConnect();
    setAtmState("auth");
  };

  useEffect(() => {
    if (isConnected && atmState === "auth") {
      setAtmState("menu");
    }
    if (!isConnected && atmState !== "idle" && atmState !== "auth") {
      setAtmState("idle");
    }
  }, [isConnected, atmState]);

  const handleWithdraw = (denom: number) => {
    setSelectedDenom(denom);
    setAtmState("processing");
    mintStartedRef.current = false;
    onMint(selectedAsset, denom);
  };

  useEffect(() => {
    if (atmState !== "processing") return;
    if (busy) {
      mintStartedRef.current = true;
    } else if (mintStartedRef.current) {
      if (lastNoteQR) {
        setAtmState("dispense");
      } else {
        setAtmState("menu");
      }
    }
  }, [atmState, busy, lastNoteQR]);

  const handlePrint = () => {
    onPrint();
    setAtmState("done");
    setTimeout(() => {
      setAtmState("menu");
      setSelectedDenom(null);
    }, 3000);
  };

  const handleParseQr = () => {
    setRedeemError(null);
    try {
      const parsed = JSON.parse(qrPayload);
      if (!parsed.noteId || !parsed.secret || parsed.denomination === undefined) {
        setRedeemError("Invalid QR payload: missing fields");
        return;
      }
      setRedeemNoteId(String(parsed.noteId));
      setRedeemSecret(parsed.secret);
      setRedeemAmount(String(parsed.denomination));
      const matched = SUPPORTED_ASSETS.find((a) => a.symbol === parsed.symbol || a.address === parsed.asset);
      if (matched) {
        setRedeemAssetSymbol(matched.symbol);
        setRedeemAssetDecimals(matched.decimals);
      } else {
        setRedeemAssetSymbol(parsed.symbol || "FLRD");
        setRedeemAssetDecimals(parsed.decimals || 6);
      }
      setShowQrInput(false);
      setQrPayload("");
    } catch {
      setRedeemError("Invalid JSON format");
    }
  };

  const handleQuickRedeem = () => {
    if (!lastNoteId || !lastNoteSecret || !lastNoteAsset) return;
    setRedeemNoteId(String(lastNoteId));
    setRedeemSecret(lastNoteSecret);
    setRedeemAmount(String(selectedDenom || ""));
    const matched = SUPPORTED_ASSETS.find((a) => a.symbol === lastNoteAsset);
    if (matched) {
      setRedeemAssetSymbol(matched.symbol);
      setRedeemAssetDecimals(matched.decimals);
    }
    setAtmState("redeem");
  };

  const handleRedeemSubmit = () => {
    const noteId = parseInt(redeemNoteId);
    const amount = parseFloat(redeemAmount);
    if (!noteId || !redeemSecret || !amount) {
      setRedeemError("All fields required");
      return;
    }
    setRedeemError(null);
    setAtmState("redeem-processing");
    redeemStartedRef.current = false;
    onRedeem(noteId, redeemSecret, amount, redeemAssetSymbol, redeemAssetDecimals);
  };

  useEffect(() => {
    if (atmState !== "redeem-processing") return;
    if (busy) {
      redeemStartedRef.current = true;
    } else if (redeemStartedRef.current) {
      if (error) {
        setAtmState("redeem");
      } else {
        setAtmState("redeem-done");
      }
    }
  }, [atmState, busy, error]);

  const escrowReady = Boolean(DEPLOYED_ADDRESSES.bearerNoteEscrow);

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>FLARE TERMINAL // ATM</span>
        <span className={`text-[10px] ${isConnected ? "text-terminal-green" : "text-terminal-amber"}`}>
          <span className={`status-led ${isConnected ? "led-green" : "led-amber"}`} />
          {isConnected ? "AUTHENTICATED" : "STANDBY"}
        </span>
      </div>
      <div className="terminal-content flex-1 overflow-auto flex flex-col items-center justify-center p-4">
        <div className="atm-screen w-full max-w-sm p-6 relative overflow-hidden" style={{ minHeight: "400px" }}>
          <div className="scan-line" />

          {/* ATM Header */}
          <div className="text-center mb-4 border-b border-terminal-border pb-2">
            <div className="text-terminal-amber text-sm font-bold glow-amber">FLARE BANK</div>
            <div className="text-terminal-white-dim text-[10px]">COSTON2 TESTNET // 24/7</div>
          </div>

          {/* ATM States */}
          {!isConnected && atmState === "idle" && (
            <div className="text-center space-y-4">
              <div className="text-terminal-white text-xs mb-4">
                WELCOME TO FLARE BANK<br />
                <span className="text-terminal-white-dim">INSERT CARD TO BEGIN</span>
              </div>
              <button className="atm-button w-full" onClick={handleConnect}>
                [ INSERT CARD ]
              </button>
            </div>
          )}

          {atmState === "auth" && (
            <div className="text-center space-y-4">
              <div className="text-terminal-amber text-xs animate-blink">
                CONNECTING WALLET...
              </div>
              <div className="text-terminal-white-dim text-[10px]">
                PLEASE APPROVE CONNECTION<br />
                IN YOUR WALLET PROVIDER
              </div>
              {error && (
                <div className="text-terminal-red text-[10px] glow-red">
                  ERROR: {error}
                </div>
              )}
              <button
                className="atm-button w-full"
                onClick={() => setAtmState("idle")}
              >
                [ CANCEL ]
              </button>
            </div>
          )}

          {isConnected && atmState === "menu" && (
            <div className="space-y-3">
              <div className="text-terminal-green text-xs mb-2">
                HELLO, {address && shortenAddress(address)}
              </div>
              <div className="text-terminal-amber text-sm font-bold mb-2 space-y-1">
                {SUPPORTED_ASSETS.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TokenLogo symbol={asset.symbol} size={16} />
                      {asset.symbol}
                    </span>
                    <span>{formatTokenAmount(balances[asset.symbol] || 0)}</span>
                  </div>
                ))}
              </div>
              {!escrowReady && (
                <div className="text-terminal-red text-[9px] px-1 border border-terminal-red/30 bg-terminal-red/10 py-1">
                  [SETUP REQUIRED] BearerNoteEscrow not deployed. Run `npm run deploy`.
                </div>
              )}
              <div className="space-y-2">
                <button
                  className="atm-button w-full text-left"
                  disabled={!escrowReady}
                  onClick={() => setAtmState("asset-select")}
                >
                  &gt; WITHDRAW CASH
                </button>
                <button
                  className="atm-button w-full text-left"
                  disabled={!escrowReady}
                  onClick={() => setAtmState("redeem")}
                >
                  &gt; REDEEM NOTE
                </button>
                {lastNoteId && lastNoteSecret && (
                  <button
                    className="atm-button w-full text-left text-terminal-green"
                    onClick={handleQuickRedeem}
                  >
                    &gt; REDEEM LAST NOTE #{lastNoteId}
                  </button>
                )}
                <button
                  className="atm-button w-full text-left"
                  onClick={onFaucet}
                  disabled={faucetPending}
                >
                  {faucetPending ? "> PROCESSING..." : "> DEPOSIT (FAUCET)"}
                </button>
                {faucetError && (
                  <div className="text-terminal-red text-[10px] glow-red px-1">
                    FAUCET ERROR: {faucetError}
                  </div>
                )}
                <button
                  className="atm-button w-full text-left opacity-50"
                  disabled
                >
                  &gt; BALANCE INQUIRY
                </button>
              </div>
            </div>
          )}

          {atmState === "asset-select" && (
            <div className="space-y-3">
              <div className="text-terminal-amber text-xs mb-3">SELECT ASSET:</div>
              <div className="space-y-2">
                {SUPPORTED_ASSETS.map((asset) => (
                  <button
                    key={asset.symbol}
                    className="atm-button w-full flex items-center justify-between"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setAtmState("withdraw");
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <TokenLogo symbol={asset.symbol} size={20} />
                      {asset.symbol}
                    </span>
                    <span className="text-[10px] text-terminal-white-dim">
                      {asset.kind === "fasset" ? `FAsset · ${asset.underlying}` : "Stable"}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="atm-button w-full mt-2"
                onClick={() => setAtmState("menu")}
              >
                [ CANCEL ]
              </button>
            </div>
          )}

          {atmState === "withdraw" && (
            <div className="space-y-3">
              <div className="text-terminal-amber text-xs mb-1 flex items-center gap-1.5">
                <TokenLogo symbol={selectedAsset.symbol} size={16} />
                WITHDRAW {selectedAsset.symbol}
              </div>
              <div className="text-terminal-white-dim text-[10px] mb-3">
                BAL: {formatTokenAmount(balances[selectedAsset.symbol] || 0)} {selectedAsset.symbol}
              </div>
              <div className="text-terminal-amber text-xs mb-2">SELECT DENOMINATION:</div>
              <div className="grid grid-cols-2 gap-2">
                {DENOMINATIONS.map((denom) => (
                  <button
                    key={denom}
                    className="atm-button"
                    disabled={busy || (balances[selectedAsset.symbol] || 0) < denom}
                    onClick={() => handleWithdraw(denom)}
                  >
                    {denom} {selectedAsset.symbol}
                  </button>
                ))}
              </div>
              <button
                className="atm-button w-full mt-2"
                onClick={() => setAtmState("asset-select")}
              >
                [ BACK ]
              </button>
            </div>
          )}

          {atmState === "redeem" && (
            <div className="space-y-3">
              <div className="text-terminal-amber text-xs mb-2">REDEEM BANKNOTE</div>

              {showQrInput ? (
                <div className="space-y-2">
                  <div className="text-terminal-white-dim text-[10px]">PASTE QR PAYLOAD (JSON):</div>
                  <textarea
                    value={qrPayload}
                    onChange={(e) => setQrPayload(e.target.value)}
                    placeholder='{"noteId":1,"secret":"0x...","denomination":50,"symbol":"FXRP","decimals":6}'
                    rows={4}
                    className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-terminal-amber"
                  />
                  <button
                    className="atm-button w-full"
                    onClick={handleParseQr}
                  >
                    [ PARSE & FILL ]
                  </button>
                  <button
                    className="atm-button w-full"
                    onClick={() => setShowQrInput(false)}
                  >
                    [ CANCEL ]
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    className="atm-button w-full text-left text-terminal-green"
                    onClick={() => setShowQrInput(true)}
                  >
                    &gt; SCAN / PASTE QR CODE
                  </button>

                  <div>
                    <div className="text-terminal-white-dim text-[10px] mb-1">NOTE ID</div>
                    <input
                      type="number"
                      value={redeemNoteId}
                      onChange={(e) => setRedeemNoteId(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
                    />
                  </div>
                  <div>
                    <div className="text-terminal-white-dim text-[10px] mb-1">SECRET (0x...)</div>
                    <input
                      type="text"
                      value={redeemSecret}
                      onChange={(e) => setRedeemSecret(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-terminal-amber"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-terminal-white-dim text-[10px] mb-1">
                      <TokenLogo symbol={redeemAssetSymbol || "FLRD"} size={16} />
                      ASSET
                    </div>
                    <select
                      value={redeemAssetSymbol}
                      onChange={(e) => {
                        const matched = SUPPORTED_ASSETS.find((a) => a.symbol === e.target.value);
                        setRedeemAssetSymbol(e.target.value);
                        if (matched) setRedeemAssetDecimals(matched.decimals);
                      }}
                      className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
                    >
                      {SUPPORTED_ASSETS.map((a) => (
                        <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-terminal-white-dim text-[10px] mb-1">AMOUNT</div>
                    <input
                      type="number"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-sm focus:outline-none focus:border-terminal-amber"
                    />
                  </div>

                  {redeemError && (
                    <div className="text-terminal-red text-[10px] glow-red">
                      ERROR: {redeemError}
                    </div>
                  )}
                  {error && (
                    <div className="text-terminal-red text-[10px] glow-red">
                      ERROR: {error}
                    </div>
                  )}

                  <button
                    className="atm-button w-full"
                    disabled={!redeemNoteId || !redeemSecret || !redeemAmount || busy}
                    onClick={handleRedeemSubmit}
                  >
                    [ REDEEM NOTE ]
                  </button>
                  <button
                    className="atm-button w-full"
                    onClick={() => {
                      setAtmState("menu");
                      setRedeemError(null);
                      setRedeemNoteId("");
                      setRedeemSecret("");
                      setRedeemAmount("");
                    }}
                  >
                    [ CANCEL ]
                  </button>
                </div>
              )}
            </div>
          )}

          {atmState === "redeem-processing" && (
            <div className="text-center space-y-4">
              <div className="text-terminal-amber text-xs animate-blink">
                REDEEMING NOTE...
              </div>
              <div className="text-terminal-white-dim text-[10px]">
                COMMITTING REDEMPTION...<br />
                WAITING FOR MATURITY...<br />
                REVEALING SECRET...<br />
                TRANSFERRING {redeemAssetSymbol || "FUNDS"}...
              </div>
              {error && (
                <div className="text-terminal-red text-[10px] glow-red">
                  ERROR: {error}
                </div>
              )}
            </div>
          )}

          {atmState === "redeem-done" && (
            <div className="text-center space-y-3">
              <div className="text-terminal-green text-xs glow-green">
                REDEMPTION COMPLETE
              </div>
              <div className="text-terminal-white-dim text-[10px]">
                NOTE #{redeemNoteId} REDEEMED<br />
                {redeemAmount} {redeemAssetSymbol} CREDITED<br />
                RETURNING TO MAIN MENU...
              </div>
              <button
                className="atm-button w-full"
                onClick={() => {
                  setAtmState("menu");
                  setRedeemNoteId("");
                  setRedeemSecret("");
                  setRedeemAmount("");
                }}
              >
                [ DONE ]
              </button>
            </div>
          )}

          {atmState === "processing" && (
            <div className="text-center space-y-4">
              <div className="text-terminal-amber text-xs animate-blink">
                PROCESSING TRANSACTION...
              </div>
              <div className="text-terminal-white-dim text-[10px]">
                MINTING {selectedAsset.symbol} BANKNOTE #{selectedDenom}<br />
                ENCRYPTING SECRET...<br />
                LOCKING ESCROW...
              </div>
              {error && (
                <div className="text-terminal-red text-[10px] glow-red">
                  ERROR: {error}
                </div>
              )}
            </div>
          )}

          {atmState === "dispense" && lastNoteQR && (
            <div className="text-center space-y-3">
              <div className="text-terminal-green text-xs glow-green animate-blink">
                DISPENSING NOTE...
              </div>
              <div className="banknote relative mx-auto" style={{ maxWidth: "200px" }}>
                <div className="banknote-watermark">$</div>
                <div className="text-terminal-green text-center">
                  <div className="text-2xl font-bold">{selectedDenom} {lastNoteAsset}</div>
                  <div className="text-[8px] text-terminal-green-dim">FLARE BANK NOTE</div>
                  <img
                    src={lastNoteQR}
                    alt="Banknote QR"
                    className="mx-auto my-2"
                    style={{ width: "120px", height: "120px" }}
                  />
                  <div className="text-[8px] text-terminal-green-dim">
                    NOTE ID: {lastNoteId}<br />
                    SCAN TO REDEEM
                  </div>
                </div>
              </div>
              <button className="atm-button w-full" onClick={handlePrint}>
                [ TAKE NOTE & PRINT ]
              </button>
            </div>
          )}

          {atmState === "done" && (
            <div className="text-center space-y-3">
              <div className="text-terminal-green text-xs glow-green">
                TRANSACTION COMPLETE
              </div>
              <div className="text-terminal-white-dim text-[10px]">
                PLEASE TAKE YOUR RECEIPT<br />
                RETURNING TO MAIN MENU...
              </div>
            </div>
          )}

          {isConnected && atmState === "idle" && (
            <div className="text-center">
              <button className="atm-button w-full" onClick={() => setAtmState("menu")}>
                [ CONTINUE ]
              </button>
            </div>
          )}
        </div>

        {/* ATM Keypad Decoration */}
        <div className="mt-3 grid grid-cols-3 gap-1 max-w-[180px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "OK"].map((key, i) => (
            <div
              key={i}
              className={`atm-button text-center opacity-50 ${key === "CLR" ? "text-terminal-red" : key === "OK" ? "text-terminal-green" : ""}`}
              style={{ cursor: "default" }}
              aria-hidden="true"
            >
              {key}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
