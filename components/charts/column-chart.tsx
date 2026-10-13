"use client";

import { ChartFrame } from "./chart-frame";

const topBar = (x: number, y: number, w: number, h: number, r: number) => {
  r = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
};

export function ColumnChart({
  labels,
  tipLabels,
  series,
  max,
  ticks,
  unit = "",
  fmt,
  labelFirst = false,
  height = 230,
  label,
}: {
  labels: string[];
  tipLabels?: string[];
  series: { name: string; color: string; values: (number | null)[] }[];
  max: number;
  ticks: number[];
  unit?: string;
  fmt: (v: number) => string | number;
  labelFirst?: boolean;
  height?: number;
  label: string;
}) {
  return (
    <ChartFrame minHeight={height} label={label}>
      {(w, h, tip) => {
        const L = 40,
          R = 8,
          T = 20,
          B = 26,
          iw = w - L - R,
          ih = h - T - B,
          n = labels.length,
          m = series.length;
        const band = iw / n,
          gw = Math.min(band * 0.72, m * 30),
          bw = (gw - (m - 1) * 2) / m;
        const y = (v: number) => T + ih - (v / max) * ih;
        return (
          <svg width={w} height={h}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={L} x2={w - R} y1={y(t)} y2={y(t)} stroke="var(--line)" />
                <text x={L - 7} y={y(t) + 4} textAnchor="end">
                  {t}
                  {unit}
                </text>
              </g>
            ))}
            {labels.map((l, i) => {
              const cx = L + i * band + band / 2;
              const v0 = series[0].values[i];
              return (
                <g key={l}>
                  <text x={cx} y={h - 6} textAnchor="middle">
                    {l}
                  </text>
                  {series.map((se, j) => {
                    const v = se.values[i];
                    if (v == null || v <= 0) return null;
                    const bx = cx - gw / 2 + j * (bw + 2),
                      by = y(v);
                    return <path key={se.name} d={topBar(bx, by, bw, T + ih - by, 4)} fill={se.color} />;
                  })}
                  {labelFirst && v0 ? (
                    <text className="val" x={cx - gw / 2 + bw / 2} y={y(v0) - 6} textAnchor="middle">
                      {fmt(v0)}
                    </text>
                  ) : null}
                  <rect
                    x={L + i * band}
                    y={T}
                    width={band}
                    height={ih}
                    fill="transparent"
                    onPointerMove={(e) =>
                      tip.show(`${tipLabels?.[i] ?? l}\n${series.map((se) => `${se.name}: ${se.values[i] == null ? "—" : fmt(se.values[i]!)}`).join("\n")}`, e)
                    }
                  />
                </g>
              );
            })}
            <line x1={L} x2={w - R} y1={T + ih} y2={T + ih} stroke="var(--line-2)" />
          </svg>
        );
      }}
    </ChartFrame>
  );
}
