"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useChild, useMe, useTeacher, useTeacherCtx } from "@/lib/hooks";
import { allClasses, classStudents, ctxLabel } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import type { DB, Role } from "@/lib/types";
import { crestInitials, firstName } from "@/lib/utils";
import { RoleSwitch } from "./RoleSwitch";

export function Brand({ db }: { db: DB }) {
  return (
    <div className="brand">
      <div className="crest">{crestInitials(db.school.name)}</div>
      <div style={{ minWidth: 0 }}>
        <b>{db.school.name}</b>
        <span>
          {db.school.board} · Academic year {db.school.year}
        </span>
      </div>
    </div>
  );
}

/** Student options grouped by class; parents are labelled "Thomas Mathew (parent of Pete)". */
export function StudentOptions({ db, asParent }: { db: DB; asParent?: boolean }) {
  return allClasses(db)
    .filter((c) => classStudents(db, c).length)
    .map((c) => (
      <optgroup key={c} label={`Class ${c}`}>
        {classStudents(db, c).map((s) => (
          <option key={s.id} value={s.id}>
            {asParent ? `${s.parent} (parent of ${firstName(s.name)})` : s.name}
          </option>
        ))}
      </optgroup>
    ));
}

function TeacherIdentity() {
  const db = useDb();
  const t = useTeacher();
  const { ctxs, key } = useTeacherCtx();
  const signIn = useStore((s) => s.signIn);
  const setUi = useStore((s) => s.setUi);
  return (
    <>
      <select aria-label="Teacher" value={t?.id ?? ""} onChange={(e) => signIn("teacher", e.target.value)}>
        {db.teachers.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      {ctxs.length ? (
        <select aria-label="Class and subject" value={key} onChange={(e) => setUi({ tctx: e.target.value })}>
          {ctxs.map((k) => (
            <option key={k} value={k}>
              {ctxLabel(db, k)}
            </option>
          ))}
        </select>
      ) : null}
    </>
  );
}

function StudentIdentity({ role }: { role: "student" | "parent" }) {
  const db = useDb();
  const me = useMe();
  const child = useChild();
  const signIn = useStore((s) => s.signIn);
  if (!db.students.length) return null;
  const current = role === "parent" ? child : me;
  return (
    <select aria-label={role === "parent" ? "Parent" : "Student"} value={current?.id ?? ""} onChange={(e) => signIn(role, e.target.value)}>
      <StudentOptions db={db} asParent={role === "parent"} />
    </select>
  );
}

export function Header({ role }: { role: Role }) {
  const db = useDb();
  const router = useRouter();
  const signOut = useStore((s) => s.signOut);
  return (
    <header className="top">
      <Brand db={db} />
      <RoleSwitch role={role} />
      <div className="who">
        {role === "admin" ? <span className="muted">Signed in as Principal’s office</span> : null}
        {role === "teacher" && db.teachers.length ? <TeacherIdentity /> : null}
        {role === "student" || role === "parent" ? <StudentIdentity role={role} /> : null}
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => {
            signOut();
            router.push("/login");
          }}
        >
          <LogOut size={14} strokeWidth={2} aria-hidden />
          Log out
        </button>
      </div>
    </header>
  );
}
