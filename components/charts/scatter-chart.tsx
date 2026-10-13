"use client";

import { ChartFrame } from "./chart-frame";

export type ScatterPoint = { name: string; x: number; y: number };

/** Attendance (x) vs score (y). Points left of xRef or below yRef are flagged red and labelled. */
export function ScatterChart({
  points,
  xMin = 50,
  xMax = 100,
  yMin = 20,
  yMax = 100,
  xRef = 75,
  yRef = 50,
  xTicks = [50, 60, 70, 80, 90, 100],
  yTicks = [20, 40, 60, 80, 100],
  xLabel,
  yLabel,
  height = 260,
  label,
}: {
  points: ScatterPoint[];
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  xRef?: number;
  yRef?: number;
  xTicks?: number[];
  yTicks?: number[];
  xLabel: string;
  yLabel: string;
  height?: number;
  label: string;
}) {
  return (
    <ChartFrame minHeight={height} label={label}>
      {(w, h, tip) => {
        const L = 44,
          R = 16,
          T = 14,
          B = 38,
          iw = w - L - R,
          ih = h - T - B;
        const x = (v: number) => L + ((v - xMin) / (xMax - xMin)) * iw;
        const y = (v: number) => T + ih - ((v - yMin) / (yMax - yMin)) * ih;
        return (
          <svg width={w} height={h}>
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={L} x2={w - R} y1={y(t)} y2={y(t)} stroke="var(--line)" />
                <text x={L - 7} y={y(t) + 4} textAnchor="end">
                  {t}%
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <text key={t} x={x(t)} y={T + ih + 15} textAnchor="middle">
                {t}%
              </text>
            ))}
            <rect x={L} y={y(yRef)} width={x(xRef) - L} height={T + ih - y(yRef)} fill="var(--bad-soft)" opacity={0.7} />
            <text x={L + 6} y={T + ih - 6} style={{ fill: "var(--bad)", fontWeight: 600 }}>
              Needs support
            </text>
            <line x1={x(xRef)} x2={x(xRef)} y1={T} y2={T + ih} stroke="var(--ink-2)" strokeDasharray="3 4" />
            <line x1={L} x2={w - R} y1={y(yRef)} y2={y(yRef)} stroke="var(--ink-2)" strokeDasharray="3 4" />
            <text x={L + iw / 2} y={h - 4} textAnchor="middle">
              {xLabel}
            </text>
            <text transform={`translate(11 ${T + ih / 2}) rotate(-90)`} textAnchor="middle">
              {yLabel}
            </text>
            {points.map((p) => {
              const px = x(Math.max(xMin, p.x)),
                py = y(Math.max(yMin, p.y)),
                flag = p.x < xRef || p.y < yRef;
              return (
                <g key={p.name}>
                  <circle cx={px} cy={py} r={6} fill={flag ? "var(--bad)" : "var(--primary)"} stroke="var(--surface)" strokeWidth={2} />
                  {flag && (
                    <text className="val" x={px + 9} y={py + 4}>
                      {p.name.split(" ")[0]}
                    </text>
                  )}
                  <circle
                    cx={px}
                    cy={py}
                    r={13}
                    fill="transparent"
                    onPointerMove={(e) => tip.show(`${p.name}\nAttendance: ${Math.round(p.x)}%\nAverage score: ${Math.round(p.y)}%`, e)}
                  />
                </g>
              );
            })}
          </svg>
        );
      }}
    </ChartFrame>
  );
}
