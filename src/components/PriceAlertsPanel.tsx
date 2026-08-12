"use client";

import type { PriceFeed } from "@/lib/types";
import type { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { TokenLogo } from "./TokenLogo";

interface PriceAlertsPanelProps {
  prices: PriceFeed[];
  alerts: ReturnType<typeof usePriceAlerts>;
}

export function PriceAlertsPanel({ prices, alerts }: PriceAlertsPanelProps) {
  const {
    alerts: allAlerts,
    triggeredAlerts,
    activeAlerts,
    newAlertSymbol,
    newAlertCondition,
    newAlertThreshold,
    setNewAlertSymbol,
    setNewAlertCondition,
    setNewAlertThreshold,
    handleAddAlert,
    removeAlert,
    toggleAlert,
    clearTriggered,
    clearAll,
  } = alerts;

  const priceMap: Record<string, number> = {};
  for (const p of prices) priceMap[p.symbol] = p.price;

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>PRICE ALERTS</span>
        <span className="text-[10px] text-terminal-white-dim">
          {activeAlerts.length} ACTIVE / {triggeredAlerts.length} TRIGGERED
        </span>
      </div>

      <div className="terminal-content flex-1 overflow-auto space-y-3 text-xs">
        {/* Create Alert */}
        <div className="space-y-2">
          <div className="text-terminal-amber text-[10px] font-bold">CREATE ALERT</div>
          <div className="flex gap-2">
            <select
              value={newAlertSymbol}
              onChange={(e) => setNewAlertSymbol(e.target.value)}
              className="bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
            >
              <option value="">SYMBOL</option>
              {prices.map((p) => (
                <option key={p.symbol} value={p.symbol}>
                  {p.symbol}
                </option>
              ))}
            </select>
            <select
              value={newAlertCondition}
              onChange={(e) => setNewAlertCondition(e.target.value as "above" | "below")}
              className="bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
            >
              <option value="above">ABOVE</option>
              <option value="below">BELOW</option>
            </select>
            <input
              type="number"
              value={newAlertThreshold}
              onChange={(e) => setNewAlertThreshold(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-terminal-panel border border-terminal-border text-terminal-amber px-2 py-1 text-[10px] focus:outline-none focus:border-terminal-amber"
            />
            <button
              className="atm-button text-[10px]"
              disabled={!newAlertThreshold || !newAlertSymbol}
              onClick={handleAddAlert}
            >
              SET
            </button>
          </div>
          {newAlertSymbol && priceMap[newAlertSymbol] && (
            <div className="flex items-center gap-1.5 text-[8px] text-terminal-white-dim">
              <TokenLogo symbol={newAlertSymbol} size={14} />
              CURRENT: ${priceMap[newAlertSymbol].toFixed(5)}
            </div>
          )}
        </div>

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-terminal-red text-[10px] font-bold glow-red">⚠ TRIGGERED</div>
              <button
                className="text-[8px] text-terminal-white-dim hover:text-terminal-red"
                onClick={clearTriggered}
              >
                [CLEAR]
              </button>
            </div>
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-terminal-red/10 border border-terminal-red/40 px-2 py-1 animate-blink"
              >
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-terminal-red text-[10px] font-bold">
                    <TokenLogo symbol={alert.symbol} size={16} />
                    {alert.symbol} {alert.condition === "above" ? "↑" : "↓"} ${alert.threshold}
                  </span>
                  <button
                    className="text-terminal-red/60 hover:text-terminal-red text-[10px]"
                    onClick={() => removeAlert(alert.id)}
                  >
                    ×
                  </button>
                </div>
                <div className="text-[8px] text-terminal-white-dim">
                  HIT ${alert.triggerPrice?.toFixed(5)} at{" "}
                  {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString() : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Alerts */}
        <div className="space-y-1">
          <div className="text-terminal-amber text-[10px] font-bold">ACTIVE ALERTS</div>
          {activeAlerts.length === 0 ? (
            <div className="text-terminal-white-dim text-[10px]">NO ACTIVE ALERTS</div>
          ) : (
            activeAlerts.map((alert) => {
              const currentPrice = priceMap[alert.symbol];
              const distance = currentPrice
                ? alert.condition === "above"
                  ? ((alert.threshold - currentPrice) / currentPrice) * 100
                  : ((currentPrice - alert.threshold) / currentPrice) * 100
                : null;
              return (
                <div
                  key={alert.id}
                  className="flex justify-between items-center bg-terminal-panel border border-terminal-border px-2 py-1"
                >
                  <div className="flex flex-1 items-center">
                    <TokenLogo symbol={alert.symbol} size={16} className="mr-1.5" />
                    <span className="text-terminal-white text-[10px] font-bold">
                      {alert.symbol}
                    </span>
                    <span className={`text-[10px] ml-1 ${alert.condition === "above" ? "text-terminal-green" : "text-terminal-red"}`}>
                      {alert.condition === "above" ? "↑≥" : "↓≤"} ${alert.threshold}
                    </span>
                    {currentPrice && (
                      <span className="text-[8px] text-terminal-white-dim ml-1">
                        (now ${currentPrice.toFixed(5)}, {distance?.toFixed(1)}% away)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="text-terminal-white-dim hover:text-terminal-amber text-[10px]"
                      onClick={() => toggleAlert(alert.id)}
                      title="Pause"
                    >
                      ❚❚
                    </button>
                    <button
                      className="text-terminal-white-dim hover:text-terminal-red text-[10px]"
                      onClick={() => removeAlert(alert.id)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Paused Alerts */}
        {allAlerts.filter((a) => !a.active).length > 0 && (
          <div className="space-y-1">
            <div className="text-terminal-white-dim text-[10px] font-bold">PAUSED</div>
            {allAlerts.filter((a) => !a.active).map((alert) => (
              <div
                key={alert.id}
                className="flex justify-between items-center bg-terminal-panel/50 border border-terminal-border/50 px-2 py-1"
              >
                <span className="flex items-center gap-1.5 text-terminal-white-dim text-[10px]">
                  <TokenLogo symbol={alert.symbol} size={15} />
                  {alert.symbol} {alert.condition === "above" ? "↑" : "↓"} ${alert.threshold}
                </span>
                <div className="flex gap-1">
                  <button
                    className="text-terminal-white-dim hover:text-terminal-green text-[10px]"
                    onClick={() => toggleAlert(alert.id)}
                    title="Resume"
                  >
                    ▶
                  </button>
                  <button
                    className="text-terminal-white-dim hover:text-terminal-red text-[10px]"
                    onClick={() => removeAlert(alert.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear All */}
        {allAlerts.length > 0 && (
          <button
            className="atm-button w-full text-[10px] border-terminal-red/50 text-terminal-red/70"
            onClick={clearAll}
          >
            [ CLEAR ALL ALERTS ]
          </button>
        )}
      </div>
    </div>
  );
}
