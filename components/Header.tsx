"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { parentLabel, wardsOf } from "@/lib/access";
import { useChild, useMe, useParentAccount, useTeacher, useTeacherCtx } from "@/lib/hooks";
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
        <span className="brand-sub">
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

function StudentIdentity() {
  const db = useDb();
  const me = useMe();
  const signIn = useStore((s) => s.signIn);
  if (!db.students.length) return null;
  return (
    <select aria-label="Student" value={me?.id ?? ""} onChange={(e) => signIn("student", e.target.value)}>
      <StudentOptions db={db} />
    </select>
  );
}

function ParentIdentity() {
  const db = useDb();
  const parent = useParentAccount();
  const child = useChild();
  const signIn = useStore((s) => s.signIn);
  const setUi = useStore((s) => s.setUi);
  const wards = wardsOf(db, parent?.id);
  if (!db.parents.length) return null;
  return (
    <>
      <select aria-label="Parent" value={parent?.id ?? ""} onChange={(e) => signIn("parent", e.target.value)}>
        {db.parents.map((p) => (
          <option key={p.id} value={p.id}>
            {parentLabel(db, p)}
          </option>
        ))}
      </select>
      {wards.length > 1 ? (
        <select aria-label="Linked ward" value={child?.id ?? ""} onChange={(e) => setUi({ ward: e.target.value })}>
          {wards.map((s) => (
            <option key={s.id} value={s.id}>
              {firstName(s.name)} · {s.cls}
            </option>
          ))}
        </select>
      ) : null}
    </>
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
        {role === "student" ? <StudentIdentity /> : null}
        {role === "parent" ? <ParentIdentity /> : null}
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
