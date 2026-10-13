"use client";

import { type PointerEvent, type ReactNode, useState } from "react";
import { useSize } from "./use-size";

export type Tip = { show: (text: string, e: PointerEvent) => void; hide: () => void };

/** Fills its panel, measures itself, and renders an SVG at the real pixel size plus a hover tooltip. */
export function ChartFrame({
  minHeight = 220,
  label,
  children,
}: {
  minHeight?: number;
  label: string;
  children: (w: number, h: number, tip: Tip) => ReactNode;
}) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const api: Tip = {
    show: (text, e) => setTip({ text, x: e.clientX, y: e.clientY }),
    hide: () => setTip(null),
  };
  return (
    <div ref={ref} className="chart" style={{ minHeight }} role="img" aria-label={label} onPointerLeave={api.hide}>
      {w > 0 && children(Math.max(220, w), Math.max(minHeight, h), api)}
      {tip && (
        <div className="chart-tip" style={{ left: Math.min(tip.x + 14, window.innerWidth - 270), top: tip.y + 16 }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}>
          <i style={{ background: i.color, ...(i.dashed ? { height: 3, borderRadius: 0 } : {}) }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export const S1 = "var(--primary)";
export const S2 = "var(--series-2)";
