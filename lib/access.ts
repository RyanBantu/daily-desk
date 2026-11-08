import { student } from "./selectors";
import type { DB, Parent, Role, Student } from "./types";
import { uid } from "./utils";

export function parentAccount(db: DB, id?: string) {
  return db.parents.find((p) => p.id === id) ?? db.parents[0];
}

export function wardsOf(db: DB, parentId?: string): Student[] {
  const p = parentAccount(db, parentId);
  if (!p) return [];
  return p.children.map((id) => student(db, id)).filter((s): s is Student => !!s);
}

export function parentLabel(db: DB, p: Parent) {
  const names = p.children.map((id) => student(db, id)?.name.split(" ")[0]).filter(Boolean);
  return names.length ? `${p.name} (parent of ${names.join(" & ")})` : p.name;
}

/** Link a student to a parent account, creating one if the guardian name is new. */
export function ensureParent(db: DB, name: string, phone: string, childId: string) {
  const key = name.trim().toLowerCase();
  let p = db.parents.find((x) => x.name.trim().toLowerCase() === key);
  if (!p) {
    p = { id: "p" + uid(), name: name.trim(), phone, children: [] };
    db.parents.push(p);
  }
  if (!p.children.includes(childId)) p.children.push(childId);
  if (phone && !p.phone) p.phone = phone;
  return p.id;
}

export function unlinkStudent(db: DB, sid: string) {
  db.students = db.students.filter((s) => s.id !== sid);
  db.parents.forEach((p) => {
    p.children = p.children.filter((id) => id !== sid);
  });
  db.fees = db.fees.filter((f) => f.sid !== sid);
}

export function teacherSeesStudent(db: DB, tid: string, sid: string) {
  const s = student(db, sid);
  if (!s) return false;
  if (db.classTeacher[s.cls] === tid) return true;
  return Object.values(db.timetable[s.cls] || {}).some((slot) => slot.teacher === tid);
}

/** Records this account is allowed to open. Demo switchers still list people; pages must filter with this. */
export function visibleStudents(db: DB, role: Role, userId: string): Student[] {
  if (role === "admin") return db.students;
  if (role === "teacher") return db.students.filter((s) => teacherSeesStudent(db, userId, s.id));
  if (role === "student") return db.students.filter((s) => s.id === userId);
  return wardsOf(db, userId);
}

export function canViewStudent(db: DB, role: Role, userId: string, sid: string) {
  return visibleStudents(db, role, userId).some((s) => s.id === sid);
}
