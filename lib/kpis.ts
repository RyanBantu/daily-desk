import type { KpiProps } from "@/components/kpi-row";
import { attByDay, attPct, attStats, cbse, classStudents, examsFor, rounds, roundAvg, shortRound } from "./selectors";
import type { DB, Student } from "./types";

/** The student's latest test round, compared with the round before and with the class. */
export function testKpi(db: DB, s: Student): KpiProps {
  const mine = examsFor(db, s.cls).filter((e) => db.marks[e.id]?.[s.id] != null);
  const [latest, prev] = rounds(db, mine);
  const my = roundAvg(db, latest, [s.id]);
  const cls = roundAvg(db, latest, classStudents(db, s.cls).map((x) => x.id));
  return {
    label: "Latest test",
    value: my != null ? Math.round(my) : "—",
    unit: my != null ? "%" : undefined,
    caption:
      latest && my != null
        ? `${latest.name} · grade ${cbse(my)}${cls != null ? ` · class ${Math.round(cls)}%` : ""}`
        : "No results yet",
    delta: { current: my, previous: roundAvg(db, prev, [s.id]), label: prev ? `vs ${shortRound(prev.name)}` : undefined },
  };
}

/** `alwaysNote` shows "Meets the minimum" too, for parents. */
export function attendanceKpi(db: DB, s: Student, alwaysNote: boolean): KpiProps {
  const my = attStats(db, s.id).pct;
  const cls = attPct(attByDay(db, (c) => c === s.cls));
  const below = my != null && my < 75;
  return {
    label: "Attendance",
    value: my ?? "—",
    unit: my != null ? "%" : undefined,
    caption: cls != null ? `Class ${Math.round(cls)}% · minimum 75%` : "Minimum 75%",
    note:
      my == null
        ? undefined
        : below
          ? { text: "Below the minimum", tone: "down" }
          : alwaysNote
            ? { text: "Meets the minimum", tone: "up" }
            : undefined,
  };
}
