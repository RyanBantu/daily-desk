import type { DB, Student } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => iso(new Date());
export const addDays = (s: string, n: number) => {
  const d = new Date(s + "T00:00");
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const diffDays = (a: string, b: string) => Math.round((+new Date(a + "T00:00") - +new Date(b + "T00:00")) / 864e5);
export const isWeekend = (s: string) => {
  const g = new Date(s + "T00:00").getDay();
  return g === 0 || g === 6;
};
export const nextSchoolDay = (s: string) => {
  let d = s;
  while (isWeekend(d)) d = addDays(d, 1);
  return d;
};
export const fmtDate = (s?: string | null) =>
  s ? new Date(s + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";
export const fmtDateLong = (s?: string | null) =>
  s ? new Date(s + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "—";

export const pctTxt = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v)}%`);
export const r1 = (v: number | null | undefined) => (v == null ? "—" : String(Math.round(v * 10) / 10));
export const cbse = (p: number) =>
  p >= 91 ? "A1" : p >= 81 ? "A2" : p >= 71 ? "B1" : p >= 61 ? "B2" : p >= 51 ? "C1" : p >= 41 ? "C2" : p >= 33 ? "D" : "E";
export const BANDS = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"] as const;
export const shortRound = (n?: string | null) => (n ?? "").replace("Periodic Test", "PT").replace("Unit Test", "UT");

export const gradeOf = (cls: string) => Number(cls.split("-")[0]);
export const classStudents = (d: DB, cls: string) => d.students.filter((s) => s.cls === cls);
export const classSubjects = (d: DB, cls: string) => [...new Set(Object.values(d.timetable[cls] ?? {}).map((s) => s.subject))];
export const subjectOf = (d: DB, id: string) => d.subjects.find((s) => s.id === id) ?? { id, name: id, code: id.toUpperCase() };
export const periodsPerWeek = (d: DB, tid: string) =>
  Object.values(d.timetable).reduce((n, slots) => n + Object.values(slots).filter((s) => s.teacher === tid).length, 0);

export type DayAtt = { d: string; p: number; t: number; pct: number };

/** One row per date: present-or-late periods / recorded periods, for keys matching `match(cls, subject)`. */
export function dailyAtt(d: DB, match: (cls: string, sub: string) => boolean, sids?: string[]): DayAtt[] {
  const by: Record<string, { p: number; t: number }> = {};
  for (const [k, rec] of Object.entries(d.attendance)) {
    const [c, s, date] = k.split("|");
    if (!match(c, s)) continue;
    const o = (by[date] ??= { p: 0, t: 0 });
    for (const [sid, v] of Object.entries(rec)) {
      if (!d.students.some((x) => x.id === sid) || (sids && !sids.includes(sid))) continue;
      o.t++;
      if (v !== "A") o.p++;
    }
  }
  return Object.keys(by)
    .sort()
    .filter((x) => by[x].t)
    .map((x) => ({ d: x, p: by[x].p, t: by[x].t, pct: Math.round((by[x].p / by[x].t) * 1000) / 10 }));
}
export const aggPct = (rows: DayAtt[]) => {
  const t = rows.reduce((a, r) => a + r.t, 0);
  return t ? Math.round((rows.reduce((a, r) => a + r.p, 0) / t) * 1000) / 10 : null;
};
export function attStats(d: DB, sid: string, sub?: string) {
  const cls = d.students.find((s) => s.id === sid)?.cls;
  let p = 0,
    a = 0,
    l = 0;
  for (const [k, rec] of Object.entries(d.attendance)) {
    const [c, s] = k.split("|");
    if (c !== cls || (sub && s !== sub)) continue;
    const v = rec[sid];
    if (v === "P") p++;
    else if (v === "A") a++;
    else if (v === "L") l++;
  }
  const t = p + a + l;
  return { p, a, l, t, pct: t ? Math.round(((p + l) / t) * 100) : null };
}
/** Per-day status for one student over the last `n` school days with records. */
export function studentDays(d: DB, sid: string, n = 15) {
  const s = d.students.find((x) => x.id === sid)!;
  const days = dailyAtt(d, (c) => c === s.cls)
    .map((x) => x.d)
    .slice(-n);
  return days.map((date) => {
    let p = 0,
      t = 0;
    const absent: string[] = [];
    for (const [k, rec] of Object.entries(d.attendance)) {
      const [c, sub, dd] = k.split("|");
      if (c !== s.cls || dd !== date || !rec[sid]) continue;
      t++;
      if (rec[sid] !== "A") p++;
      else absent.push(subjectOf(d, sub).code);
    }
    return { date, p, t, absent, pct: t ? (p / t) * 100 : null };
  });
}

/** School-wide test rounds for a grade that have marks, oldest first. */
export function rounds(d: DB, grade: number) {
  const first: Record<string, string> = {};
  d.exams
    .filter((e) => e.grade === grade && !e.cls && Object.keys(d.marks[e.id] ?? {}).length)
    .forEach((e) => {
      if (!first[e.name] || e.date < first[e.name]) first[e.name] = e.date;
    });
  return Object.keys(first).sort((a, b) => first[a].localeCompare(first[b]));
}
/** Average % across the given students (and optional subject) for one round. */
export function roundPct(d: DB, sids: string[], grade: number, name: string, sub?: string) {
  let t = 0,
    n = 0;
  d.exams
    .filter((e) => e.grade === grade && !e.cls && e.name === name && (!sub || e.subject === sub))
    .forEach((e) =>
      sids.forEach((id) => {
        const m = d.marks[e.id]?.[id];
        if (m != null) {
          t += (m / e.max) * 100;
          n++;
        }
      }),
    );
  return n ? Math.round((t / n) * 10) / 10 : null;
}
export function gradeDist(d: DB, sids: string[], grade: number, name: string, sub?: string) {
  const c: Record<string, number> = Object.fromEntries(BANDS.map((b) => [b, 0]));
  d.exams
    .filter((e) => e.grade === grade && !e.cls && e.name === name && (!sub || e.subject === sub))
    .forEach((e) =>
      sids.forEach((id) => {
        const m = d.marks[e.id]?.[id];
        if (m != null) c[cbse((m / e.max) * 100)]++;
      }),
    );
  return BANDS.map((b) => c[b]);
}
/** Average % over every exam (incl. class tests) with marks for this student. */
export function avgPct(d: DB, sid: string, sub?: string) {
  const s = d.students.find((x) => x.id === sid);
  if (!s) return null;
  const g = gradeOf(s.cls);
  const rows = d.exams
    .filter((e) => e.grade === g && (!e.cls || e.cls === s.cls) && (!sub || e.subject === sub) && d.marks[e.id]?.[sid] != null)
    .map((e) => (d.marks[e.id][sid] / e.max) * 100);
  return rows.length ? Math.round(rows.reduce((a, b) => a + b, 0) / rows.length) : null;
}

export function hwCounts(d: DB, cls: string, sub?: string, sids?: string[]) {
  const hw = d.homework.filter((h) => h.cls === cls && (!sub || h.subject === sub));
  const n = (sids ?? classStudents(d, cls).map((s) => s.id)).length;
  const done = d.submissions.filter((x) => hw.some((h) => h.id === x.hw) && (!sids || sids.includes(x.sid))).length;
  return { done, expected: hw.length * n, pct: hw.length && n ? Math.round((done / (hw.length * n)) * 100) : null };
}
/** Share of planned unit-days already elapsed. */
export function coverage(d: DB, cls: string, sub: string) {
  const u = d.plan.filter((x) => x.cls === cls && x.subject === sub);
  if (!u.length) return null;
  let tot = 0,
    done = 0;
  u.forEach((x) => {
    const len = diffDays(x.end, x.start) + 1;
    tot += len;
    done += Math.max(0, Math.min(len, diffDays(today(), x.start) + 1));
  });
  return Math.round((done / tot) * 100);
}
export const studentName = (s?: Student) => s?.name ?? "";
