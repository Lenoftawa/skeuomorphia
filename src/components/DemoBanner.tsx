"use client";

import type { ReactNode } from "react";

interface DemoBannerProps {
  title: string;
  children: ReactNode;
  note?: string;
}

/**
 * Wraps a panel that is currently a simulation/demo so it is never mistaken
 * for a live on-chain action. The banner is always visible at the top.
 */
export function DemoBanner({ title, children, note }: DemoBannerProps) {
  return (
    <div className="relative h-full flex flex-col">
      <div className="border-b border-terminal-amber/40 bg-terminal-amber/10 px-2 py-1 text-[9px] text-terminal-amber flex items-center gap-2 flex-shrink-0">
        <span className="status-led led-amber" />
        <span className="font-bold">[LABS · SIMULATION]</span>
        <span className="text-terminal-amber-dim">{title}</span>
        {note && <span className="text-terminal-white-dim hidden sm:inline">— {note}</span>}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
