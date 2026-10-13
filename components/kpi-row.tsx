import { ReactNode } from "react";

export type KpiDelta = {
  current: number | null;
  previous: number | null;
  unit?: string;   // e.g. " pts"
  label?: string;  // e.g. "vs UT 1"
};

export type KpiProps = {
  label: string;           // small uppercase label, e.g. "Attendance"
  value: ReactNode;        // main number, e.g. 93.6
  unit?: string;           // e.g. "%"
  caption: string;         // one-line context under the number
  delta?: KpiDelta;        // change vs previous period (green up / red down)
  note?: { text: string; tone: "up" | "down" }; // fixed note instead of a delta
};

function Delta({ current, previous, unit = " pts", label = "vs before" }: KpiDelta) {
  if (current == null || previous == null) return null;
  const d = Math.round((current - previous) * 10) / 10;
  if (d === 0) return <span className="kpi-delta">No change {label}</span>;
  return (
    <span className={`kpi-delta ${d > 0 ? "up" : "down"}`}>
      {d > 0 ? "▲" : "▼"} {Math.abs(d)}
      {unit} {label}
    </span>
  );
}

export function Kpi({ label, value, unit, caption, delta, note }: KpiProps) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <div className="kpi-line">
        <span className="kpi-value">
          {value}
          {unit && <small>{unit}</small>}
        </span>
        {delta && <Delta {...delta} />}
        {note && <span className={`kpi-delta ${note.tone}`}>{note.text}</span>}
      </div>
      <span className="kpi-caption" title={caption}>{caption}</span>
    </div>
  );
}

export function KpiRow({ items }: { items: KpiProps[] }) {
  return (
    <section className="kpi-row" aria-label="Summary">
      {items.map((k) => (
        <Kpi key={k.label} {...k} />
      ))}
    </section>
  );
}

/** "Periodic Test 1" → "PT 1", "Unit Test 2" → "UT 2" */
export const shortRound = (name?: string | null) =>
  (name ?? "").replace("Periodic Test", "PT").replace("Unit Test", "UT");
