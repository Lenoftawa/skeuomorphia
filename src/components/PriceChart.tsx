"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PriceHistoryPoint } from "@/hooks/useFTSO";

interface PriceChartProps {
  data: PriceHistoryPoint[];
  symbol: string;
  height?: number;
}

type Timeframe = "5S" | "15S" | "1M" | "5M";
type ChartType = "CANDLES" | "LINE" | "AREA" | "BARS";
type Preset = "DEFAULT" | "SCALPER" | "ANALYST" | "MINIMAL";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartSettings {
  timeframe: Timeframe;
  chartType: ChartType;
  showEMA: boolean;
  showBB: boolean;
  showVWAP: boolean;
  showVol: boolean;
  showRSI: boolean;
  showMACD: boolean;
  autoFollow: boolean;
}

const DEFAULT_SETTINGS: ChartSettings = {
  timeframe: "15S",
  chartType: "CANDLES",
  showEMA: true,
  showBB: false,
  showVWAP: false,
  showVol: true,
  showRSI: true,
  showMACD: false,
  autoFollow: true,
};

const PRESETS: Record<Preset, ChartSettings> = {
  DEFAULT: { ...DEFAULT_SETTINGS },
  SCALPER: { timeframe: "5S", chartType: "CANDLES", showEMA: true, showBB: false, showVWAP: true, showVol: true, showRSI: false, showMACD: false, autoFollow: true },
  ANALYST: { timeframe: "1M", chartType: "CANDLES", showEMA: true, showBB: true, showVWAP: false, showVol: true, showRSI: true, showMACD: true, autoFollow: false },
  MINIMAL: { timeframe: "15S", chartType: "LINE", showEMA: false, showBB: false, showVWAP: false, showVol: false, showRSI: false, showMACD: false, autoFollow: true },
};

const TIMEFRAME_MS: Record<Timeframe, number> = {
  "5S": 5_000,
  "15S": 15_000,
  "1M": 60_000,
  "5M": 300_000,
};

const SETTINGS_KEY = "flare-terminal-chart-settings";

function loadSettings(): ChartSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: ChartSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

function formatPrice(price: number): string {
  if (price === 0) return "0";
  const abs = Math.abs(price);
  if (abs < 0.0001) return price.toFixed(8);
  if (abs < 1) return price.toFixed(5);
  if (abs < 1000) return price.toFixed(2);
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatAxisTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function aggregateCandles(ticks: PriceHistoryPoint[], tfMs: number): Candle[] {
  if (ticks.length === 0) return [];
  const sorted = [...ticks].sort((a, b) => a.timestamp - b.timestamp);
  const candles: Candle[] = [];
  let currentBucket = Math.floor(sorted[0].timestamp / tfMs) * tfMs;
  let open = sorted[0].price;
  let high = sorted[0].price;
  let low = sorted[0].price;
  let close = sorted[0].price;
  let volume = 0;
  let prevPrice = sorted[0].price;

  for (let i = 0; i < sorted.length; i++) {
    const tick = sorted[i];
    const bucket = Math.floor(tick.timestamp / tfMs) * tfMs;
    if (bucket !== currentBucket) {
      candles.push({ time: currentBucket, open, high, low, close, volume });
      currentBucket = bucket;
      open = tick.price;
      high = tick.price;
      low = tick.price;
      close = tick.price;
      volume = Math.abs(tick.price - prevPrice);
    } else {
      high = Math.max(high, tick.price);
      low = Math.min(low, tick.price);
      close = tick.price;
      volume += Math.abs(tick.price - prevPrice);
    }
    prevPrice = tick.price;
  }
  candles.push({ time: currentBucket, open, high, low, close, volume });
  return candles;
}

function ema(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (prev === null) {
      const slice = values.slice(0, period);
      prev = slice.reduce((s, v) => s + v, 0) / period;
      result.push(prev);
    } else {
      prev = values[i] * k + prev * (1 - k);
      result.push(prev);
    }
  }
  return result;
}

function bollingerBands(values: number[], period: number, mult: number) {
  const upper: (number | null)[] = [];
  const mid: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { upper.push(null); mid.push(null); lower.push(null); continue; }
    const slice = values.slice(i - period + 1, i + 1);
    const sma = slice.reduce((s, v) => s + v, 0) / period;
    const variance = slice.reduce((s, v) => s + (v - sma) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    mid.push(sma); upper.push(sma + mult * sd); lower.push(sma - mult * sd);
  }
  return { upper, mid, lower };
}

function rsi(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < values.length; i++) {
    if (i === 0) { result.push(null); continue; }
    const change = values[i] - values[i - 1];
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);
    if (i <= period) {
      avgGain += gain; avgLoss += loss;
      if (i === period) {
        avgGain /= period; avgLoss /= period;
        result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
      } else result.push(null);
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    }
  }
  return result;
}

function macd(values: number[], fast: number, slow: number, signal: number) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine: (number | null)[] = values.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i]! - emaSlow[i]! : null
  );
  const validMacd = macdLine.map((v) => v ?? 0);
  const signalLine = ema(validMacd, signal);
  const histogram: (number | null)[] = macdLine.map((v, i) =>
    v != null && signalLine[i] != null ? v - signalLine[i]! : null
  );
  return { macdLine, signalLine, histogram };
}

function vwap(candles: Candle[]): (number | null)[] {
  let cumPV = 0;
  let cumV = 0;
  return candles.map((c) => {
    const typical = (c.high + c.low + c.close) / 3;
    cumPV += typical * c.volume;
    cumV += c.volume;
    return cumV > 0 ? cumPV / cumV : null;
  });
}

export function PriceChart({ data, symbol, height = 280 }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const viewRef = useRef<{ offset: number; barSpacing: number }>({ offset: 0, barSpacing: 8 });
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [settings, setSettings] = useState<ChartSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [hoverCandle, setHoverCandle] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);

  // Load saved settings once
  useEffect(() => {
    setSettings(loadSettings());
    setSettingsLoaded(true);
  }, []);

  // Save settings on change
  useEffect(() => {
    if (settingsLoaded) saveSettings(settings);
  }, [settings, settingsLoaded]);

  const update = useCallback(<K extends keyof ChartSettings>(key: K, value: ChartSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setSettings(PRESETS[preset]);
    setActivePreset(preset);
  }, []);

  const { timeframe, chartType, showEMA, showBB, showVWAP, showVol, showRSI, showMACD, autoFollow } = settings;

  const validData = useMemo(
    () => data.filter((p) => Number.isFinite(p.price) && p.price > 0 && Number.isFinite(p.timestamp)).sort((a, b) => a.timestamp - b.timestamp),
    [data]
  );

  const candles = useMemo(() => aggregateCandles(validData, TIMEFRAME_MS[timeframe]), [validData, timeframe]);
  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const ema12 = useMemo(() => ema(closes, 12), [closes]);
  const ema26 = useMemo(() => ema(closes, 26), [closes]);
  const bb = useMemo(() => bollingerBands(closes, 20, 2), [closes]);
  const rsiData = useMemo(() => rsi(closes, 14), [closes]);
  const macdData = useMemo(() => macd(closes, 12, 26, 9), [closes]);
  const vwapData = useMemo(() => vwap(candles), [candles]);

  const stats = useMemo(() => {
    if (candles.length === 0) return null;
    const last = candles[candles.length - 1];
    const first = candles[0];
    return {
      last,
      change: first.close ? ((last.close - first.close) / first.close) * 100 : 0,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
    };
  }, [candles]);

  const drawImpl = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const priceScaleW = 64;
    const timeScaleH = 22;
    const subPanes = (showVol ? 1 : 0) + (showRSI ? 1 : 0) + (showMACD ? 1 : 0);
    const subH = subPanes > 0 ? Math.max(32, h * 0.1) : 0;
    const separatorH = subPanes > 0 ? 6 : 0;
    const totalSubH = subPanes * subH + subPanes * separatorH;
    const priceH = h - timeScaleH - totalSubH;
    const left = 0;
    const right = w - priceScaleW;
    const chartW = Math.max(right - left, 1);

    // Background
    ctx.fillStyle = "#08080c";
    ctx.fillRect(0, 0, w, h);

    if (candles.length < 2) {
      ctx.fillStyle = "#555560";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("COLLECTING MARKET DATA...", w / 2, h / 2);
      return;
    }

    const view = viewRef.current;
    const barSpacing = Math.max(2, Math.min(50, view.barSpacing));
    const candleW = barSpacing * 0.7;
    const totalWidth = candles.length * barSpacing;

    // Auto-follow: pin to right edge
    if (autoFollow) {
      view.offset = Math.max(0, totalWidth - chartW);
    }
    let offset = Math.max(0, Math.min(view.offset, Math.max(0, totalWidth - chartW)));

    const visibleStart = Math.floor(offset / barSpacing);
    const visibleEnd = Math.min(candles.length, Math.ceil((offset + chartW) / barSpacing) + 1);

    if (visibleEnd <= visibleStart) return;

    // Price range
    let minP = Infinity, maxP = -Infinity;
    for (let i = visibleStart; i < visibleEnd; i++) {
      minP = Math.min(minP, candles[i].low);
      maxP = Math.max(maxP, candles[i].high);
    }
    if (showBB) {
      for (let i = visibleStart; i < visibleEnd; i++) {
        if (bb.upper[i] != null) maxP = Math.max(maxP, bb.upper[i]!);
        if (bb.lower[i] != null) minP = Math.min(minP, bb.lower[i]!);
      }
    }
    if (showEMA) {
      for (let i = visibleStart; i < visibleEnd; i++) {
        if (ema12[i] != null) { maxP = Math.max(maxP, ema12[i]!); minP = Math.min(minP, ema12[i]!); }
        if (ema26[i] != null) { maxP = Math.max(maxP, ema26[i]!); minP = Math.min(minP, ema26[i]!); }
      }
    }
    if (showVWAP) {
      for (let i = visibleStart; i < visibleEnd; i++) {
        if (vwapData[i] != null) { maxP = Math.max(maxP, vwapData[i]!); minP = Math.min(minP, vwapData[i]!); }
      }
    }
    const pPad = (maxP - minP) * 0.08 || maxP * 0.01 || 1;
    minP -= pPad; maxP += pPad;
    const pRange = maxP - minP || 1;
    const yPrice = (price: number) => 4 + ((maxP - price) / pRange) * (priceH - 8);
    const xFor = (i: number) => left + (i * barSpacing) - offset + barSpacing / 2;

    // ── Watermark ──
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#ffb000";
    ctx.font = `bold ${Math.min(48, w / 8)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`${symbol}/USD`, w / 2, priceH / 2 + 16);
    ctx.font = `${Math.min(14, w / 24)}px monospace`;
    ctx.fillText(timeframe, w / 2, priceH / 2 + 36);
    ctx.restore();

    // ── Grid ──
    ctx.strokeStyle = "rgba(85,85,96,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = 4 + ((priceH - 8) / gridSteps) * i;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = left + (chartW / 6) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, priceH); ctx.stroke();
    }
    ctx.setLineDash([]);

    // ── Price scale ──
    ctx.fillStyle = "#666674";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    for (let i = 0; i <= gridSteps; i++) {
      const val = maxP - (pRange / gridSteps) * i;
      const y = 4 + ((priceH - 8) / gridSteps) * i + 3;
      ctx.fillText(formatPrice(val), right + 4, y);
    }

    // ── Bollinger Bands ──
    if (showBB) {
      const drawLine = (arr: (number|null)[], color: string, lw = 1) => {
        ctx.beginPath();
        let started = false;
        for (let i = visibleStart; i < visibleEnd; i++) {
          if (arr[i] == null) { started = false; continue; }
          const x = xFor(i), y = yPrice(arr[i]!);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
      };
      ctx.beginPath();
      let started = false;
      for (let i = visibleStart; i < visibleEnd; i++) {
        if (bb.upper[i] == null) { started = false; continue; }
        const x = xFor(i), y = yPrice(bb.upper[i]!);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      for (let i = visibleEnd - 1; i >= visibleStart; i--) {
        if (bb.lower[i] == null) continue;
        ctx.lineTo(xFor(i), yPrice(bb.lower[i]!));
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(100,149,237,0.05)"; ctx.fill();
      drawLine(bb.upper, "rgba(100,149,237,0.5)");
      drawLine(bb.lower, "rgba(100,149,237,0.5)");
      drawLine(bb.mid, "rgba(100,149,237,0.3)");
    }

    // ── VWAP ──
    if (showVWAP) {
      ctx.beginPath();
      let started = false;
      for (let i = visibleStart; i < visibleEnd; i++) {
        if (vwapData[i] == null) { started = false; continue; }
        const x = xFor(i), y = yPrice(vwapData[i]!);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(187,136,255,0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── EMA lines ──
    if (showEMA) {
      const drawEMA = (arr: (number|null)[], color: string) => {
        ctx.beginPath();
        let started = false;
        for (let i = visibleStart; i < visibleEnd; i++) {
          if (arr[i] == null) { started = false; continue; }
          const x = xFor(i), y = yPrice(arr[i]!);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
      };
      drawEMA(ema12, "#ffb000");
      drawEMA(ema26, "#00d4ff");
    }

    // ── Candles / Line / Area / Bars ──
    if (chartType === "CANDLES") {
      for (let i = visibleStart; i < visibleEnd; i++) {
        const c = candles[i];
        const x = xFor(i);
        const isUp = c.close >= c.open;
        const color = isUp ? "#00ff88" : "#ff4060";
        // Wick
        ctx.strokeStyle = isUp ? "rgba(0,255,136,0.8)" : "rgba(255,64,96,0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yPrice(c.high));
        ctx.lineTo(x, yPrice(c.low));
        ctx.stroke();
        // Body — hollow up candles (TradingView style)
        const yO = yPrice(c.open);
        const yC = yPrice(c.close);
        const bodyH = Math.max(1, Math.abs(yC - yO));
        const bodyY = Math.min(yO, yC);
        if (isUp) {
          ctx.fillStyle = "#08080c";
          ctx.fillRect(x - candleW / 2, bodyY, candleW, bodyH);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.strokeRect(x - candleW / 2 + 0.5, bodyY + 0.5, candleW - 1, bodyH - 1);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(x - candleW / 2, bodyY, candleW, bodyH);
        }
      }
    } else if (chartType === "BARS") {
      for (let i = visibleStart; i < visibleEnd; i++) {
        const c = candles[i];
        const x = xFor(i);
        const isUp = c.close >= c.open;
        const color = isUp ? "#00ff88" : "#ff4060";
        const yO = yPrice(c.open);
        const yC = yPrice(c.close);
        const barH = Math.max(1, Math.abs(yC - yO));
        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 4, Math.min(yO, yC), candleW / 2, barH);
        // Left tick = open, right tick = close
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - candleW / 2, yO); ctx.lineTo(x, yO);
        ctx.moveTo(x, yC); ctx.lineTo(x + candleW / 2, yC);
        ctx.stroke();
      }
    } else {
      const color = candles[candles.length - 1].close >= candles[0].close ? "#00ff88" : "#ff4060";
      if (chartType === "AREA") {
        ctx.beginPath();
        ctx.moveTo(xFor(visibleStart), priceH);
        for (let i = visibleStart; i < visibleEnd; i++) ctx.lineTo(xFor(i), yPrice(candles[i].close));
        ctx.lineTo(xFor(visibleEnd - 1), priceH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, priceH);
        grad.addColorStop(0, color === "#00ff88" ? "rgba(0,255,136,0.18)" : "rgba(255,64,96,0.18)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad; ctx.fill();
      }
      ctx.beginPath();
      for (let i = visibleStart; i < visibleEnd; i++) {
        const x = xFor(i), y = yPrice(candles[i].close);
        if (i === visibleStart) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.shadowColor = color; ctx.shadowBlur = 4; ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ── Last price line + label ──
    const lastCandle = candles[candles.length - 1];
    const lastY = yPrice(lastCandle.close);
    const lastColor = lastCandle.close >= lastCandle.open ? "#00ff88" : "#ff4060";
    ctx.strokeStyle = lastColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(left, lastY); ctx.lineTo(right, lastY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = lastColor;
    ctx.fillRect(right, lastY - 7, priceScaleW, 14);
    ctx.fillStyle = "#050508";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillText(formatPrice(lastCandle.close), right + 4, lastY + 3);

    // ── Sub-pane helper ──
    let subTop = priceH + separatorH;
    const drawSubPane = (label: string, labelColor: string, render: (top: number, h: number) => void) => {
      const paneH = subH;
      // Separator line
      ctx.strokeStyle = "rgba(34,34,48,0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, subTop - separatorH / 2); ctx.lineTo(w, subTop - separatorH / 2); ctx.stroke();
      // Label
      ctx.fillStyle = labelColor;
      ctx.font = "7px monospace";
      ctx.textAlign = "left";
      ctx.fillText(label, left + 4, subTop + 10);
      render(subTop, paneH);
      subTop += paneH + separatorH;
    };

    // ── Volume pane ──
    if (showVol) {
      drawSubPane("VOL", "#44444f", (top, paneH) => {
        const maxVol = Math.max(...candles.slice(visibleStart, visibleEnd).map((c) => c.volume), 0.0001);
        for (let i = visibleStart; i < visibleEnd; i++) {
          const c = candles[i];
          const x = xFor(i);
          const isUp = c.close >= c.open;
          const barH = (c.volume / maxVol) * (paneH - 4);
          ctx.fillStyle = isUp ? "rgba(0,255,136,0.3)" : "rgba(255,64,96,0.3)";
          ctx.fillRect(x - candleW / 2, top + paneH - barH - 2, candleW, barH);
        }
      });
    }

    // ── RSI pane ──
    if (showRSI) {
      drawSubPane("RSI 14", "#bb88ff", (top, paneH) => {
        ctx.strokeStyle = "rgba(85,85,96,0.1)";
        ctx.setLineDash([2, 4]);
        [30, 50, 70].forEach((lvl) => {
          const y = top + ((100 - lvl) / 100) * (paneH - 4) + 2;
          ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(85,85,96,0.35)";
        ctx.font = "7px monospace";
        ctx.textAlign = "right";
        ctx.fillText("70", right - 2, top + ((100 - 70) / 100) * (paneH - 4) + 4);
        ctx.fillText("30", right - 2, top + ((100 - 30) / 100) * (paneH - 4) + 4);
        ctx.beginPath();
        let started = false;
        for (let i = visibleStart; i < visibleEnd; i++) {
          if (rsiData[i] == null) { started = false; continue; }
          const x = xFor(i);
          const y = top + ((100 - rsiData[i]!) / 100) * (paneH - 4) + 2;
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#bb88ff"; ctx.lineWidth = 1.2; ctx.stroke();
      });
    }

    // ── MACD pane ──
    if (showMACD) {
      drawSubPane("MACD 12 26 9", "#00d4ff", (top, paneH) => {
        let macdMax = -Infinity, macdMin = Infinity;
        for (let i = visibleStart; i < visibleEnd; i++) {
          if (macdData.histogram[i] != null) {
            macdMax = Math.max(macdMax, macdData.histogram[i]!);
            macdMin = Math.min(macdMin, macdData.histogram[i]!);
          }
        }
        const macdRange = Math.max(Math.abs(macdMax), Math.abs(macdMin), 0.0001) * 1.2;
        const yMacd = (v: number) => top + paneH / 2 - (v / macdRange) * (paneH / 2 - 4);
        // Zero line
        ctx.strokeStyle = "rgba(85,85,96,0.2)";
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(left, top + paneH / 2); ctx.lineTo(right, top + paneH / 2); ctx.stroke();
        ctx.setLineDash([]);
        // Histogram
        for (let i = visibleStart; i < visibleEnd; i++) {
          if (macdData.histogram[i] == null) continue;
          const x = xFor(i);
          const v = macdData.histogram[i]!;
          const y = yMacd(v);
          const zeroY = yMacd(0);
          ctx.fillStyle = v >= 0 ? "rgba(0,255,136,0.4)" : "rgba(255,64,96,0.4)";
          ctx.fillRect(x - candleW / 2, Math.min(y, zeroY), candleW, Math.max(1, Math.abs(y - zeroY)));
        }
        // MACD line + signal line
        const drawMacdLine = (arr: (number|null)[], color: string) => {
          ctx.beginPath();
          let started = false;
          for (let i = visibleStart; i < visibleEnd; i++) {
            if (arr[i] == null) { started = false; continue; }
            const x = xFor(i), y = yMacd(arr[i]!);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
        };
        drawMacdLine(macdData.macdLine, "#00d4ff");
        drawMacdLine(macdData.signalLine, "#ffb000");
      });
    }

    // ── Time scale ──
    const timeY = h - timeScaleH + 4;
    ctx.fillStyle = "#666674";
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    const timeStep = Math.max(1, Math.floor(chartW / 80));
    for (let i = visibleStart; i < visibleEnd; i += timeStep) {
      const x = xFor(i);
      if (x < left || x > right) continue;
      ctx.fillText(formatAxisTime(candles[i].time), x, timeY + 8);
    }

    // ── Crosshair ──
    const pointer = pointerRef.current;
    let nearestIdx = -1;
    if (pointer && pointer.x >= left && pointer.x <= right) {
      let minDist = Infinity;
      for (let i = visibleStart; i < visibleEnd; i++) {
        const dist = Math.abs(xFor(i) - pointer.x);
        if (dist < minDist) { minDist = dist; nearestIdx = i; }
      }
      if (nearestIdx >= 0) {
        const cx = xFor(nearestIdx);
        ctx.strokeStyle = "rgba(208,208,216,0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h - timeScaleH); ctx.stroke();
        if (pointer.y < priceH) {
          ctx.beginPath(); ctx.moveTo(left, pointer.y); ctx.lineTo(right, pointer.y); ctx.stroke();
          const cursorPrice = maxP - (pointer.y / (priceH - 8)) * pRange;
          ctx.fillStyle = "#33333d";
          ctx.fillRect(right, pointer.y - 7, priceScaleW, 14);
          ctx.fillStyle = "#d0d0d8";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "left";
          ctx.fillText(formatPrice(cursorPrice), right + 4, pointer.y + 3);
        }
        ctx.setLineDash([]);
        // Time label
        ctx.fillStyle = "#33333d";
        const timeLabel = formatAxisTime(candles[nearestIdx].time);
        ctx.font = "7px monospace";
        const tw = ctx.measureText(timeLabel).width + 8;
        ctx.fillRect(Math.max(left, Math.min(right - tw, cx - tw / 2)), h - timeScaleH, tw, timeScaleH);
        ctx.fillStyle = "#d0d0d8";
        ctx.textAlign = "center";
        ctx.fillText(timeLabel, Math.max(left + tw / 2, Math.min(right - tw / 2, cx)), h - 6);
      }
    }

    // ── OHLC Legend ──
    if (candles.length > 0) {
      const hc = nearestIdx >= 0 ? candles[nearestIdx] : candles[candles.length - 1];
      const isUp = hc.close >= hc.open;
      const legendColor = isUp ? "#00ff88" : "#ff4060";
      const chg = hc.open ? ((hc.close - hc.open) / hc.open) * 100 : 0;
      ctx.textAlign = "left";
      // Compact horizontal layout (TradingView style)
      const parts = [
        { t: `${symbol} `, c: "#ffb000", b: true },
        { t: `${timeframe} `, c: "#666674" },
        { t: `O ${formatPrice(hc.open)} `, c: "#888894" },
        { t: `H ${formatPrice(hc.high)} `, c: "#888894" },
        { t: `L ${formatPrice(hc.low)} `, c: "#888894" },
        { t: `C ${formatPrice(hc.close)} `, c: legendColor },
        { t: `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`, c: legendColor },
      ];
      let lx = left + 6;
      const ly = 14;
      for (const p of parts) {
        ctx.font = `${p.b ? "bold " : ""}8px monospace`;
        ctx.fillStyle = p.c;
        ctx.fillText(p.t, lx, ly);
        lx += ctx.measureText(p.t).width;
      }
      // Volume on second line
      ctx.font = "7px monospace";
      ctx.fillStyle = "#555560";
      ctx.fillText(`VOL ${hc.volume.toFixed(6)}`, left + 6, ly + 11);
    }
  }, [candles, chartType, height, hoverCandle, showBB, showEMA, showRSI, showVol, showMACD, showVWAP, autoFollow, symbol, timeframe, bb, ema12, ema26, rsiData, macdData, vwapData]);

  // Keep drawImpl ref current for the scheduler
  const drawImplRef = useRef(drawImpl);
  drawImplRef.current = drawImpl;

  const draw = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawImplRef.current();
    });
    // Fallback: if rAF doesn't fire (headless/backgrounded), use setTimeout
    setTimeout(() => {
      if (rafRef.current != null) {
        rafRef.current = null;
        drawImplRef.current();
      }
    }, 50);
  }, []);

  useEffect(() => {
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => { ro.disconnect(); if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  // Pan & zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = { startX: e.clientX, startOffset: viewRef.current.offset };
      // Disable auto-follow when user starts panning
      if (autoFollow) setSettings((s) => ({ ...s, autoFollow: false }));
    };
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        viewRef.current.offset = Math.max(0, dragRef.current.startOffset - dx);
      }
      draw();
    };
    const onPointerUp = (e: PointerEvent) => {
      canvas.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    };
    const onPointerLeave = () => {
      pointerRef.current = null;
      draw();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.85 : 1.18;
      viewRef.current.barSpacing = Math.max(2, Math.min(50, viewRef.current.barSpacing * factor));
      draw();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [draw, autoFollow]);

  // Redraw when data or settings change
  useEffect(() => { draw(); }, [draw, candles, settings]);

  const exportChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${symbol}_chart_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [symbol]);

  const isUp = stats ? stats.change >= 0 : true;

  return (
    <div className="price-chart-container advanced-chart">
      <div className="chart-toolbar">
        <div className="chart-quote">
          <span className="chart-symbol">{symbol}/USD</span>
          <span className="chart-price">{stats ? `$${formatPrice(stats.last.close)}` : "—"}</span>
          <span className={isUp ? "chart-change up" : "chart-change down"}>
            {stats ? `${stats.change >= 0 ? "+" : ""}${stats.change.toFixed(2)}%` : "—"}
          </span>
        </div>
        <div className="chart-controls">
          {(["DEFAULT", "SCALPER", "ANALYST", "MINIMAL"] as Preset[]).map((p) => (
            <button key={p} className={`preset ${activePreset === p ? "active" : ""}`} onClick={() => applyPreset(p)}>{p.slice(0, 3)}</button>
          ))}
          <span className="chart-sep" />
          {(["5S", "15S", "1M", "5M"] as Timeframe[]).map((tf) => (
            <button key={tf} className={timeframe === tf ? "active" : ""} onClick={() => update("timeframe", tf)}>{tf}</button>
          ))}
          <span className="chart-sep" />
          {(["CANDLES", "LINE", "AREA", "BARS"] as ChartType[]).map((ct) => (
            <button key={ct} className={chartType === ct ? "active" : ""} onClick={() => update("chartType", ct)}>
              {ct === "CANDLES" ? "CNDL" : ct === "BARS" ? "BARS" : ct}
            </button>
          ))}
          <span className="chart-sep" />
          <button className={showEMA ? "active ema" : "ema"} onClick={() => update("showEMA", !showEMA)}>EMA</button>
          <button className={showBB ? "active bb" : "bb"} onClick={() => update("showBB", !showBB)}>BB</button>
          <button className={showVWAP ? "active vwap" : "vwap"} onClick={() => update("showVWAP", !showVWAP)}>VWAP</button>
          <button className={showVol ? "active vol" : "vol"} onClick={() => update("showVol", !showVol)}>VOL</button>
          <button className={showRSI ? "active rsi" : "rsi"} onClick={() => update("showRSI", !showRSI)}>RSI</button>
          <button className={showMACD ? "active macd" : "macd"} onClick={() => update("showMACD", !showMACD)}>MACD</button>
          <span className="chart-sep" />
          <button className={autoFollow ? "active follow" : "follow"} onClick={() => update("autoFollow", !autoFollow)} title="Auto-scroll to latest">▶</button>
          <button className="export" onClick={exportChart} title="Save chart as PNG">📷</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={`${symbol}/USD advanced candlestick chart`}
        style={{ width: "100%", height: `${height}px`, display: "block", cursor: "crosshair", touchAction: "none" }}
      />
      <div className="chart-stats">
        <span>HIGH <b>{stats ? `$${formatPrice(stats.high)}` : "—"}</b></span>
        <span>LOW <b>{stats ? `$${formatPrice(stats.low)}` : "—"}</b></span>
        <span>CANDLES <b>{candles.length}</b></span>
        <span>TF <b>{timeframe}</b></span>
        <span className="chart-legend">
          {showEMA && <><i className="ema12" />EMA12<i className="ema26" />EMA26</>}
          {showBB && <><i className="bb" />BB(20,2)</>}
          {showVWAP && <><i className="vwap" />VWAP</>}
          {showRSI && <><i className="rsi" />RSI14</>}
          {showMACD && <><i className="macd" />MACD</>}
        </span>
      </div>
    </div>
  );
}
