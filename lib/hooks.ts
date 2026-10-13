"use client";

import { student, teacher, teacherCtxs } from "./selectors";
import { useDb, useStore } from "./store";

export function useTeacher() {
  const db = useDb();
  const tid = useStore((s) => s.ui.tid);
  return teacher(db, tid) ?? db.teachers[0];
}

/** The teacher's class·subject combinations and the one currently selected in the header. */
export function useTeacherCtx() {
  const db = useDb();
  const t = useTeacher();
  const tctx = useStore((s) => s.ui.tctx);
  const ctxs = teacherCtxs(db, t?.id);
  const key = ctxs.includes(tctx) ? tctx : ctxs[0] || "";
  const [cls, sub] = key ? key.split("|") : [null, null];
  return { tid: t?.id ?? "", ctxs, key, cls, sub } as
    | { tid: string; ctxs: string[]; key: string; cls: string; sub: string }
    | { tid: string; ctxs: string[]; key: ""; cls: null; sub: null };
}

export function useMe() {
  const db = useDb();
  const sid = useStore((s) => s.ui.sid);
  return student(db, sid) ?? db.students[0];
}

export function useChild() {
  const db = useDb();
  const pid = useStore((s) => s.ui.pid);
  return student(db, pid) ?? db.students[0];
}
