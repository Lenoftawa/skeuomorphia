"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PriceHistoryPoint } from "@/hooks/useFTSO";

interface PriceChartProps {
  data: PriceHistoryPoint[];
  symbol: string;
  height?: number;
}

type ChartRange = "LIVE" | "24H";
type ChartStyle = "AREA" | "LINE";

function formatPrice(price: number): string {
  if (price < 0.0001) return price.toFixed(8);
  if (price < 1) return price.toFixed(5);
  if (price < 1000) return price.toFixed(2);
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatAxisTime(timestamp: number, span: number): string {
  const date = new Date(timestamp);
  if (span >= 3_600_000) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return date.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
}

export function PriceChart({ data, symbol, height = 180 }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const [range, setRange] = useState<ChartRange>("24H");
  const [style, setStyle] = useState<ChartStyle>("AREA");
  const [showAverage, setShowAverage] = useState(true);

  const validData = useMemo(
    () => data
      .filter((point) => Number.isFinite(point.price) && point.price > 0 && Number.isFinite(point.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp),
    [data]
  );

  const visibleData = useMemo(() => {
    if (range === "24H" || validData.length < 3) return validData;
    const latestTimestamp = validData[validData.length - 1].timestamp;
    const livePoints = validData.filter((point) => point.timestamp >= latestTimestamp - 300_000);
    return livePoints.length >= 2 ? livePoints : validData.slice(-2);
  }, [range, validData]);

  const stats = useMemo(() => {
    if (visibleData.length === 0) return null;
    const prices = visibleData.map((point) => point.price);
    const first = prices[0];
    const current = prices[prices.length - 1];
    return {
      current,
      high: Math.max(...prices),
      low: Math.min(...prices),
      change: first ? ((current - first) / first) * 100 : 0,
    };
  }, [visibleData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
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

      // Background
      const background = ctx.createLinearGradient(0, 0, 0, h);
      background.addColorStop(0, "#0b0b11");
      background.addColorStop(1, "#060609");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);

      if (visibleData.length < 2) {
        ctx.fillStyle = "#555560";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("COLLECTING PRICE DATA...", w / 2, h / 2);
        return;
      }

      const prices = visibleData.map((point) => point.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || Math.max(maxPrice * 0.002, 0.000001);
      const padding = priceRange * 0.14;
      const min = minPrice - padding;
      const max = maxPrice + padding;
      const valueRange = max - min;
      const leftPad = 10;
      const rightPad = w < 260 ? 48 : 64;
      const topPad = 12;
      const bottomPad = 24;
      const chartW = Math.max(w - leftPad - rightPad, 1);
      const chartH = Math.max(h - topPad - bottomPad, 1);
      const firstTimestamp = visibleData[0].timestamp;
      const lastTimestamp = visibleData[visibleData.length - 1].timestamp;
      const timeRange = Math.max(lastTimestamp - firstTimestamp, 1);
      const xFor = (timestamp: number) => leftPad + ((timestamp - firstTimestamp) / timeRange) * chartW;
      const yFor = (price: number) => topPad + chartH - ((price - min) / valueRange) * chartH;

      // Grid lines
      ctx.strokeStyle = "rgba(85, 85, 96, 0.24)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      for (let i = 0; i <= 4; i++) {
        const y = topPad + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(leftPad, y);
        ctx.lineTo(leftPad + chartW, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 4; i++) {
        const x = leftPad + (chartW / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, topPad);
        ctx.lineTo(x, topPad + chartH);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Price labels (y-axis)
      ctx.fillStyle = "#666674";
      ctx.font = "8px monospace";
      ctx.textAlign = "left";
      for (let i = 0; i <= 4; i++) {
        const value = max - (valueRange / 4) * i;
        const y = topPad + (chartH / 4) * i + 3;
        ctx.fillText(`$${formatPrice(value)}`, leftPad + chartW + 5, y);
      }

      // Time labels (x-axis)
      ctx.textAlign = "center";
      const labelCount = w < 300 ? 2 : 4;
      for (let i = 0; i <= labelCount; i++) {
        const ratio = i / labelCount;
        const timestamp = firstTimestamp + timeRange * ratio;
        const x = leftPad + chartW * ratio;
        ctx.fillText(formatAxisTime(timestamp, timeRange), x, h - 6);
      }

      // Determine color based on trend
      const isUp = prices[prices.length - 1] >= prices[0];
      const lineColor = isUp ? "#00ff88" : "#ff4060";
      const mutedColor = isUp ? "rgba(0, 255, 136, 0.24)" : "rgba(255, 64, 96, 0.24)";

      // Fill area under line
      if (style === "AREA") {
        ctx.beginPath();
        ctx.moveTo(xFor(visibleData[0].timestamp), topPad + chartH);
        visibleData.forEach((point) => ctx.lineTo(xFor(point.timestamp), yFor(point.price)));
        ctx.lineTo(xFor(visibleData[visibleData.length - 1].timestamp), topPad + chartH);
        ctx.closePath();
        const fill = ctx.createLinearGradient(0, topPad, 0, topPad + chartH);
        fill.addColorStop(0, mutedColor);
        fill.addColorStop(0.72, isUp ? "rgba(0, 255, 136, 0.04)" : "rgba(255, 64, 96, 0.04)");
        fill.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = fill;
        ctx.fill();
      }

      // Draw line
      ctx.beginPath();
      visibleData.forEach((point, index) => {
        const x = xFor(point.timestamp);
        const y = yFor(point.price);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.75;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (showAverage && visibleData.length >= 3) {
        const averagePoints = visibleData.map((point, index) => {
          const start = Math.max(0, index - 4);
          const window = visibleData.slice(start, index + 1);
          return {
            timestamp: point.timestamp,
            price: window.reduce((sum, item) => sum + item.price, 0) / window.length,
          };
        });
        ctx.beginPath();
        averagePoints.forEach((point, index) => {
          const x = xFor(point.timestamp);
          const y = yFor(point.price);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = "rgba(255, 176, 0, 0.78)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Current price dot
      const lastPoint = visibleData[visibleData.length - 1];
      const lastX = xFor(lastPoint.timestamp);
      const lastY = yFor(lastPoint.price);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 9;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = lineColor;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(leftPad + chartW, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      const priceLabel = `$${formatPrice(lastPoint.price)}`;
      ctx.font = "bold 8px monospace";
      const labelWidth = Math.min(rightPad - 4, ctx.measureText(priceLabel).width + 8);
      ctx.fillStyle = lineColor;
      ctx.fillRect(leftPad + chartW + 2, lastY - 7, labelWidth, 14);
      ctx.fillStyle = "#050508";
      ctx.textAlign = "left";
      ctx.fillText(priceLabel, leftPad + chartW + 6, lastY + 3);

      // Symbol label
      ctx.fillStyle = "rgba(255, 176, 0, 0.65)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${symbol}/USD · ${range}`, leftPad + 3, topPad + 10);

      // High/Low labels
      ctx.fillStyle = "#777784";
      ctx.font = "8px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`H $${formatPrice(maxPrice)}`, leftPad + chartW - 3, topPad + 10);
      ctx.fillText(`L $${formatPrice(minPrice)}`, leftPad + chartW - 3, topPad + chartH - 5);

      const pointer = pointerRef.current;
      if (pointer && pointer.x >= leftPad && pointer.x <= leftPad + chartW && pointer.y >= topPad && pointer.y <= topPad + chartH) {
        const nearest = visibleData.reduce((closest, point) => (
          Math.abs(xFor(point.timestamp) - pointer.x) < Math.abs(xFor(closest.timestamp) - pointer.x) ? point : closest
        ));
        const hoverX = xFor(nearest.timestamp);
        const hoverY = yFor(nearest.price);
        ctx.strokeStyle = "rgba(208, 208, 216, 0.45)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hoverX, topPad);
        ctx.lineTo(hoverX, topPad + chartH);
        ctx.moveTo(leftPad, hoverY);
        ctx.lineTo(leftPad + chartW, hoverY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(hoverX, hoverY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#08080c";
        ctx.fill();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        const tooltipWidth = 122;
        const tooltipHeight = 38;
        const tooltipX = hoverX + tooltipWidth + 10 > w ? hoverX - tooltipWidth - 10 : hoverX + 10;
        const tooltipY = Math.max(4, Math.min(h - tooltipHeight - 4, hoverY - tooltipHeight / 2));
        ctx.fillStyle = "rgba(12, 12, 18, 0.96)";
        ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        ctx.strokeStyle = "rgba(255, 176, 0, 0.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX + 0.5, tooltipY + 0.5, tooltipWidth - 1, tooltipHeight - 1);
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffb000";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`$${formatPrice(nearest.price)}`, tooltipX + 7, tooltipY + 14);
        ctx.fillStyle = "#888894";
        ctx.font = "8px monospace";
        ctx.fillText(new Date(nearest.timestamp).toLocaleString(), tooltipX + 7, tooltipY + 29);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      draw();
    };
    const handlePointerLeave = () => {
      pointerRef.current = null;
      draw();
    };

    draw();
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [height, range, showAverage, style, symbol, visibleData]);

  return (
    <div className="price-chart-container advanced-chart">
      <div className="chart-toolbar">
        <div className="chart-quote">
          <span className="chart-symbol">{symbol}/USD</span>
          <span className="chart-price">{stats ? `$${formatPrice(stats.current)}` : "—"}</span>
          <span className={stats && stats.change >= 0 ? "chart-change up" : "chart-change down"}>
            {stats ? `${stats.change >= 0 ? "+" : ""}${stats.change.toFixed(2)}%` : "—"}
          </span>
        </div>
        <div className="chart-controls">
          {(["LIVE", "24H"] as ChartRange[]).map((value) => (
            <button key={value} className={range === value ? "active" : ""} onClick={() => setRange(value)}>{value}</button>
          ))}
          {(["AREA", "LINE"] as ChartStyle[]).map((value) => (
            <button key={value} className={style === value ? "active" : ""} onClick={() => setStyle(value)}>{value}</button>
          ))}
          <button className={showAverage ? "active average" : "average"} onClick={() => setShowAverage((current) => !current)}>MA5</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={`${symbol}/USD interactive ${range.toLowerCase()} price chart`}
        style={{ width: "100%", height: `${height}px` }}
      />
      <div className="chart-stats">
        <span>HIGH <b>{stats ? `$${formatPrice(stats.high)}` : "—"}</b></span>
        <span>LOW <b>{stats ? `$${formatPrice(stats.low)}` : "—"}</b></span>
        <span>POINTS <b>{visibleData.length}</b></span>
        <span className="chart-legend"><i className="price" />PRICE <i className="average" />MA5</span>
      </div>
    </div>
  );
}
