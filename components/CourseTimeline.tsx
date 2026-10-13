"use client";

import type { Unit } from "@/lib/types";
import { diffDays, fmtDate, today } from "@/lib/utils";
import { Empty } from "./Panel";
import { Pill } from "./Pill";

export function CourseTimeline({
  units,
  emptyMsg = "No units planned yet.",
}: {
  units: Unit[];
  emptyMsg?: string;
}) {
  if (!units.length) return <Empty>{emptyMsg}</Empty>;
  const t = today();
  const s = units.reduce((m, u) => (u.start < m ? u.start : m), units[0].start);
  const e = units.reduce((m, u) => (u.end > m ? u.end : m), units[0].end);
  const span = Math.max(1, diffDays(e, s) + 1);
  const pos = (x: string) => Math.min(100, Math.max(0, (diffDays(x, s) / span) * 100));
  const tp = diffDays(t, s) >= 0 && diffDays(e, t) >= 0 ? pos(t) : null;
  return (
    <div className="gantt">
      {[...units]
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((u) => {
          const [cls, label, tone] =
            u.end < t ? (["done", "Completed", "ok"] as const) : u.start <= t ? (["now", "In progress", "info"] as const) : (["", "Upcoming", "mute"] as const);
          return (
            <div className="g-row" key={u.id}>
              <div>
                <b>{u.title}</b>
                <span className="muted mono">
                  {fmtDate(u.start)} – {fmtDate(u.end)}
                </span>
              </div>
              <div className="g-track">
                <i
                  className={`g-bar ${cls}`}
                  style={{ left: `${pos(u.start)}%`, width: `${Math.max(1.5, ((diffDays(u.end, u.start) + 1) / span) * 100)}%` }}
                />
                {tp != null ? <span className="g-today" style={{ left: `${tp}%` }} title="Today" /> : null}
              </div>
              <div className="r">
                <Pill tone={tone}>{label}</Pill>
              </div>
            </div>
          );
        })}
      <div className="g-row" style={{ paddingTop: 2 }}>
        <span />
        <div className="g-axis">
          <span>{fmtDate(s)}</span>
          {tp != null ? <span style={{ color: "var(--ink)", fontWeight: 600 }}>▲ Today</span> : null}
          <span>{fmtDate(e)}</span>
        </div>
        <span />
      </div>
    </div>
  );
}
