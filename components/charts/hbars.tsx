"use client";

export type HBarRow = { label: string; value: number | null; max?: number; display: string; tone?: "bad" | "warn"; compare?: number | null; tip?: string };

/** Horizontal bars in HTML. Optional red reference line (refPct) and amber tick for a previous value (compare). */
export function HBars({ rows, refPct, note }: { rows: HBarRow[]; refPct?: number; note?: string }) {
  return (
    <>
      <div className="hbars">
        {rows.map((r) => {
          const max = r.max ?? 100;
          return (
            <div className="hb" key={r.label} title={r.tip ?? `${r.label}: ${r.display}`}>
              <span className="hb-l">{r.label}</span>
              <div className="hb-t">
                <i className={r.tone ?? ""} style={{ width: `${Math.max(0, Math.min(100, ((r.value ?? 0) / max) * 100))}%` }} />
                {refPct != null && <s style={{ left: `${refPct}%` }} />}
                {r.compare != null && <u style={{ left: `${Math.min(100, (r.compare / max) * 100)}%` }} />}
              </div>
              <span className="hb-v">{r.display}</span>
            </div>
          );
        })}
      </div>
      {note && <p className="chart-note">{note}</p>}
    </>
  );
}
