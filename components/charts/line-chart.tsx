"use client";

import { ChartFrame } from "./chart-frame";

export type LineSeries = { name: string; color: string; values: (number | null)[]; dashed?: boolean };

export function LineChart({
  labels,
  tipLabels,
  series,
  min,
  max,
  ticks,
  unit = "",
  fmt,
  refLine,
  area = true,
  height = 230,
  label,
}: {
  labels: string[];
  tipLabels?: string[];
  series: LineSeries[];
  min: number;
  max: number;
  ticks: number[];
  unit?: string;
  fmt: (v: number) => string;
  refLine?: { value: number; label: string };
  area?: boolean;
  height?: number;
  label: string;
}) {
  return (
    <ChartFrame minHeight={height} label={label}>
      {(w, h, tip) => {
        const L = 40,
          R = 16,
          T = 18,
          B = 26,
          iw = w - L - R,
          ih = h - T - B,
          n = labels.length;
        const x = (i: number) => L + (n < 2 ? iw / 2 : (i * iw) / (n - 1));
        const y = (v: number) => T + ih - ((v - min) / (max - min)) * ih;
        const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
        const show: number[] = [];
        for (let i = 0; i < n; i += step) show.push(i);
        if (show.at(-1) !== n - 1) {
          if (n > 1 && x(n - 1) - x(show.at(-1)!) < 64) show.pop();
          show.push(n - 1);
        }
        const cw = n < 2 ? iw : iw / (n - 1);
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
            {refLine && (
              <g>
                <line x1={L} x2={w - R} y1={y(refLine.value)} y2={y(refLine.value)} stroke="var(--bad)" strokeDasharray="4 4" strokeWidth={1.5} />
                <text x={L + 4} y={y(refLine.value) - 5} style={{ fill: "var(--bad)" }}>
                  {refLine.label}
                </text>
              </g>
            )}
            {show.map((i) => (
              <text key={i} x={x(i)} y={h - 6} textAnchor={n > 1 && i === n - 1 ? "end" : n > 1 && i === 0 ? "start" : "middle"}>
                {labels[i]}
              </text>
            ))}
            {series.map((se, si) => {
              const pts = se.values.map((v, i) => (v == null ? null : ([x(i), y(v)] as const))).filter(Boolean) as (readonly [number, number])[];
              if (!pts.length) return null;
              const last = se.values.filter((v) => v != null).at(-1) as number;
              return (
                <g key={se.name}>
                  {si === 0 && area && (
                    <path d={`M${pts[0][0]},${T + ih} L${pts.map((p) => p.join(",")).join(" L")} L${pts.at(-1)![0]},${T + ih} Z`} fill={se.color} opacity={0.09} />
                  )}
                  <polyline
                    points={pts.map((p) => p.join(",")).join(" ")}
                    fill="none"
                    stroke={se.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={se.dashed ? "6 4" : undefined}
                  />
                  {pts.map((p, i) => (
                    <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 5 : 3.5} fill={se.color} stroke="var(--surface)" strokeWidth={2} />
                  ))}
                  {si === 0 && (
                    <text className="val" x={pts.at(-1)![0] - 9} y={pts.at(-1)![1] - 11} textAnchor="end">
                      {fmt(last)}
                    </text>
                  )}
                </g>
              );
            })}
            {labels.map((l, i) => (
              <rect
                key={i}
                x={x(i) - cw / 2}
                y={T}
                width={cw}
                height={ih}
                fill="transparent"
                onPointerMove={(e) =>
                  tip.show(`${tipLabels?.[i] ?? l}\n${series.map((se) => `${se.name}: ${se.values[i] == null ? "—" : fmt(se.values[i]!)}`).join("\n")}`, e)
                }
              />
            ))}
          </svg>
        );
      }}
    </ChartFrame>
  );
}
