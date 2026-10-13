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
