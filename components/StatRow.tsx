import type { CSSProperties, ReactNode } from "react";

export interface StatItem {
  label: string;
  value: ReactNode;
  unit?: string;
  caption: ReactNode;
  valueStyle?: CSSProperties;
}

export function StatRow({ items }: { items: StatItem[] }) {
  return (
    <div className="stats">
      {items.map((s) => (
        <div className="stat" key={s.label}>
          <span className="eyebrow">{s.label}</span>
          <span className="n" style={s.valueStyle}>
            {s.value}
            {s.unit ? <small>{s.unit}</small> : null}
          </span>
          <span className="s">{s.caption}</span>
        </div>
      ))}
    </div>
  );
}
