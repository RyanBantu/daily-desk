"use client";

export function Ring({ pct, label, color = "var(--primary)" }: { pct: number | null; label: string; color?: string }) {
  const r = 34,
    c = 2 * Math.PI * r,
    v = pct ?? 0;
  return (
    <svg width={88} height={88} viewBox="0 0 88 88" role="img" aria-label={`${label}: ${pct == null ? "—" : Math.round(pct) + "%"}`} style={{ flex: "none" }}>
      <circle cx={44} cy={44} r={r} fill="none" stroke="var(--sunk)" strokeWidth={9} />
      {v > 0 && (
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${(c * v) / 100} ${c}`}
          transform="rotate(-90 44 44)"
        />
      )}
      <text x={44} y={49} textAnchor="middle" style={{ fontSize: 16, fontWeight: 600, fill: "var(--ink)" }}>
        {pct == null ? "—" : `${Math.round(pct)}%`}
      </text>
    </svg>
  );
}
