import type { DB, Deadline, Exam, Homework, Level, NoticeCategory, PillTone, Scope, Student, Subject } from "./types";
import { GRADES, LETTERS, diffDays, pad, shortName, today } from "./utils";

export function cbse(pct: number) {
  return pct >= 91 ? "A1" : pct >= 81 ? "A2" : pct >= 71 ? "B1" : pct >= 61 ? "B2" : pct >= 51 ? "C1" : pct >= 41 ? "C2" : pct >= 33 ? "D" : "E";
}

export const subj = (db: DB, id: string): Subject =>
  db.subjects.find((s) => s.id === id) || { id, name: id, code: id.toUpperCase() };
export const teacher = (db: DB, id?: string) => db.teachers.find((t) => t.id === id);
export const tName = (db: DB, id?: string) => teacher(db, id)?.name || "Unassigned";
export const shortNameOf = (db: DB, id?: string) => shortName(tName(db, id));
export const student = (db: DB, id?: string) => db.students.find((s) => s.id === id);
export const gradeOf = (cls: string) => Number(cls.split("-")[0]);

export const allClasses = (db: DB) =>
  GRADES.flatMap((g) => Array.from({ length: db.sections[g] || 0 }, (_, i) => `${g}-${LETTERS[i]}`));
export const classStudents = (db: DB, cls: string) => db.students.filter((s) => s.cls === cls);
export const rollOf = (db: DB, s: Student) => pad(classStudents(db, s.cls).indexOf(s) + 1);

export const scopeMatch = (scope: Scope, cls: string) => scope === "all" || scope === "g" + gradeOf(cls) || scope === cls;
export const scopeLabel = (s: Scope) =>
  s === "all" ? "Whole school" : s.startsWith("g") ? `Class ${s.slice(1)} (all sections)` : `Class ${s}`;
export const scopeOpts = (db: DB): [string, string][] => [
  ["all", "Whole school"],
  ...GRADES.map((g): [string, string] => ["g" + g, `Class ${g} (all sections)`]),
  ...allClasses(db).map((c): [string, string] => [c, `Class ${c}`]),
];

export const classSubjects = (db: DB, cls: string) =>
  [...new Set(Object.values(db.timetable[cls] || {}).map((s) => s.subject))].sort((a, b) =>
    subj(db, a).name.localeCompare(subj(db, b).name),
  );
export const subjTeacher = (db: DB, cls: string, sub: string) =>
  Object.values(db.timetable[cls] || {}).find((s) => s.subject === sub)?.teacher;

/** "cls|subject" keys a teacher has on the timetable, highest grade first. */
export function teacherCtxs(db: DB, tid?: string) {
  const set = new Set<string>();
  Object.entries(db.timetable).forEach(([cls, slots]) =>
    Object.values(slots).forEach((s) => {
      if (s.teacher === tid) set.add(cls + "|" + s.subject);
    }),
  );
  return [...set].sort((a, b) => {
    const [ca] = a.split("|"), [cb] = b.split("|");
    return gradeOf(cb) - gradeOf(ca) || ca.localeCompare(cb) || a.localeCompare(b);
  });
}
export const ctxLabel = (db: DB, k: string) => {
  const [c, s] = k.split("|");
  return `${c} · ${subj(db, s).name}`;
};
export const periodsPerWeek = (db: DB, tid?: string) =>
  Object.values(db.timetable).reduce((n, slots) => n + Object.values(slots).filter((s) => s.teacher === tid).length, 0);
export const classTeacherOf = (db: DB, tid?: string) => {
  const cls = allClasses(db);
  return Object.entries(db.classTeacher)
    .filter(([c, t]) => t === tid && cls.includes(c))
    .map(([c]) => c);
};

export function attStats(db: DB, sid: string, sub?: string) {
  let p = 0, a = 0, l = 0;
  const cls = student(db, sid)?.cls;
  for (const [k, rec] of Object.entries(db.attendance)) {
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

export const examsFor = (db: DB, cls: string) =>
  db.exams
    .filter((e) => e.grade === gradeOf(cls) && (!e.cls || e.cls === cls))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

export interface Result {
  e: Exam;
  m: number;
  pct: number;
}
export function results(db: DB, sid: string, sub?: string): Result[] {
  const s = student(db, sid);
  if (!s) return [];
  return examsFor(db, s.cls)
    .filter((e) => (!sub || e.subject === sub) && db.marks[e.id]?.[s.id] != null)
    .map((e) => {
      const m = db.marks[e.id][s.id];
      return { e, m, pct: Math.round((m / e.max) * 100) };
    });
}
export function avgPct(db: DB, sid: string, sub?: string) {
  const r = results(db, sid, sub);
  return r.length ? Math.round(r.reduce((a, x) => a + x.pct, 0) / r.length) : null;
}

export const subFor = (db: DB, hw: string, sid: string) => db.submissions.find((x) => x.hw === hw && x.sid === sid);

export function dueState(db: DB, h: Homework, sid?: string): [string, PillTone] {
  const s = sid ? subFor(db, h.id, sid) : undefined;
  if (s) return s.status === "reviewed" ? ["Reviewed", "ok"] : ["Submitted", "info"];
  if (!h.due) return ["No due date", "mute"];
  const d = diffDays(h.due, today());
  if (d < 0) return ["Overdue", "bad"];
  if (d === 0) return ["Due today", "warn"];
  if (d === 1) return ["Due tomorrow", "warn"];
  return [`Due in ${d} days`, "mute"];
}

export const deadlinesFor = (db: DB, cls: string): Deadline[] =>
  db.deadlines.filter((d) => scopeMatch(d.scope, cls)).sort((a, b) => a.date.localeCompare(b.date));
export const noticesFor = (db: DB, cls: string) =>
  db.notices.filter((n) => scopeMatch(n.scope, cls)).sort((a, b) => b.date.localeCompare(a.date));

export const catTone = (c: NoticeCategory): PillTone =>
  c === "Inspection" ? "bad" : c === "Exam" ? "warn" : c === "Holiday" ? "ok" : "info";
export const levelTone = (l: Level): PillTone =>
  l === "Excellent" ? "ok" : l === "Good" ? "info" : l === "Satisfactory" ? "mute" : "warn";

export const pendingSubmissions = (db: DB, ctxs: string[]) => {
  const ids = db.homework.filter((h) => ctxs.includes(h.cls + "|" + h.subject)).map((h) => h.id);
  return db.submissions.filter((s) => ids.includes(s.hw) && s.status === "pending");
};

export const shortRound = (name: string) => name.replace(/Periodic Test/g, "PT").replace(/Unit Test/g, "UT");

/** A test sitting: every marked exam sharing a name within one grade. */
export interface Round {
  name: string;
  grade: number;
  date: string;
  exams: Exam[];
}
/** Groups exams that have marks into rounds, newest first. */
export function rounds(db: DB, exams: Exam[]): Round[] {
  const by = new Map<string, Round>();
  exams
    .filter((e) => Object.keys(db.marks[e.id] || {}).length)
    .forEach((e) => {
      const k = e.grade + "|" + e.name;
      const r = by.get(k) ?? { name: e.name, grade: e.grade, date: e.date, exams: [] };
      r.exams.push(e);
      if (e.date > r.date) r.date = e.date;
      by.set(k, r);
    });
  return [...by.values()].sort((a, b) => b.date.localeCompare(a.date));
}
/** Mean percentage over every mark in the round, optionally limited to some students. */
export function roundAvg(db: DB, r: Round | undefined, sids?: string[]) {
  if (!r) return null;
  let sum = 0, n = 0;
  r.exams.forEach((e) =>
    Object.entries(db.marks[e.id] || {}).forEach(([sid, m]) => {
      if (sids && !sids.includes(sid)) return;
      sum += (m / e.max) * 100;
      n++;
    }),
  );
  return n ? sum / n : null;
}

export interface AttDay {
  date: string;
  present: number;
  total: number;
}
/** Attendance marks per day for records whose class and subject pass `match`, oldest first. */
export function attByDay(db: DB, match: (cls: string, sub: string) => boolean, sids?: string[]): AttDay[] {
  const by = new Map<string, AttDay>();
  for (const [k, rec] of Object.entries(db.attendance)) {
    const [c, s, date] = k.split("|");
    if (!match(c, s)) continue;
    const d = by.get(date) ?? { date, present: 0, total: 0 };
    for (const [sid, v] of Object.entries(rec)) {
      if (sids && !sids.includes(sid)) continue;
      d.total++;
      if (v !== "A") d.present++;
    }
    by.set(date, d);
  }
  return [...by.values()].filter((d) => d.total).sort((a, b) => a.date.localeCompare(b.date));
}
export function attPct(days: AttDay[]) {
  const t = days.reduce((n, d) => n + d.total, 0);
  return t ? (days.reduce((n, d) => n + d.present, 0) / t) * 100 : null;
}

/** Submissions received against one per student in each homework's class. */
export function handIn(db: DB, list: Homework[]) {
  let done = 0, expected = 0;
  list.forEach((h) => {
    const ids = classStudents(db, h.cls).map((s) => s.id);
    expected += ids.length;
    done += new Set(db.submissions.filter((x) => x.hw === h.id && ids.includes(x.sid)).map((x) => x.sid)).size;
  });
  return { done, expected, pct: expected ? Math.round((done / expected) * 100) : null };
}

/** Share of the course timeline's days already behind us, and the unit running today. */
export function coverage(db: DB, cls: string, sub: string) {
  const units = db.plan.filter((u) => u.cls === cls && u.subject === sub);
  const t0 = today();
  let total = 0, done = 0;
  units.forEach((u) => {
    const len = diffDays(u.end, u.start) + 1;
    total += len;
    done += Math.min(len, Math.max(0, diffDays(t0, u.start) + 1));
  });
  return {
    pct: total ? Math.round((done / total) * 100) : null,
    current: units.find((u) => u.start <= t0 && t0 <= u.end),
  };
}

export const daysUntil = (date: string) => {
  const n = diffDays(date, today());
  return n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
};
