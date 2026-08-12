"use client";

import { useRef, useEffect } from "react";
import type { PriceHistoryPoint } from "@/hooks/useFTSO";

interface SparklineProps {
  data: PriceHistoryPoint[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 60, height = 20 }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) {
      ctx.fillStyle = "#3a3a45";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("...", width / 2, height / 2 + 3);
      return;
    }

    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const isUp = prices[prices.length - 1] >= prices[0];
    const color = isUp ? "#00ff88" : "#ff4060";

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = (width * i) / (data.length - 1);
      const y = height - ((d.price - min) / range) * (height - 2) - 1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Fill
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = isUp ? "rgba(0,255,136,0.1)" : "rgba(255,64,96,0.1)";
    ctx.fill();
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px`, display: "block" }}
    />
  );
}
