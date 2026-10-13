"use client";

import { fmtDateLong } from "@/lib/analytics";

export function AttendanceStrip({ days }: { days: { date: string; p: number; t: number; absent: string[]; pct: number | null }[] }) {
  return (
    <>
      <div className="strip" style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
        {days.map((d) => (
          <div
            key={d.date}
            className={d.pct == null ? "" : d.pct === 100 ? "ok" : d.pct >= 50 ? "warn" : "bad"}
            title={`${fmtDateLong(d.date)}\n${d.t ? `Present ${d.p} of ${d.t} periods` : "No periods recorded"}${d.absent.length ? `\nAbsent: ${d.absent.join(", ")}` : ""}`}
          >
            <span>{new Date(d.date + "T00:00").getDate()}</span>
          </div>
        ))}
      </div>
      <div className="legend" style={{ marginTop: 10 }}>
        <span>
          <i style={{ background: "var(--ok)" }} />
          All periods
        </span>
        <span>
          <i style={{ background: "var(--warn)" }} />
          Missed some
        </span>
        <span>
          <i style={{ background: "var(--bad)" }} />
          Missed most
        </span>
      </div>
    </>
  );
}
