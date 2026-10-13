"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { StudentOptions } from "@/components/Header";
import { Ready } from "@/components/StoreBoot";
import { toast } from "@/components/Toast";
import { student, teacher } from "@/lib/selectors";
import { isRole } from "@/lib/session";
import { useDb, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { crestInitials } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Ready>
      <LoginCard />
    </Ready>
  );
}

function LoginCard() {
  const db = useDb();
  const router = useRouter();
  const { ui, session, signIn } = useStore();
  const [role, setRole] = useState<Role>(session?.role ?? "admin");
  const [tid, setTid] = useState(teacher(db, ui.tid)?.id ?? db.teachers[0]?.id ?? "");
  const [sid, setSid] = useState(student(db, ui.sid)?.id ?? db.students[0]?.id ?? "");
  const [pid, setPid] = useState(student(db, ui.pid)?.id ?? db.students[0]?.id ?? "");

  const userId = role === "teacher" ? tid : role === "student" ? sid : role === "parent" ? pid : "admin";
  const missing =
    role === "teacher" && !db.teachers.length
      ? "No teachers yet. Log in as Admin and add staff under Teachers & subjects."
      : (role === "student" || role === "parent") && !db.students.length
        ? "No students yet. A class teacher adds them from My class roster."
        : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (missing || !userId) return toast(missing ?? "Choose who to log in as.");
    signIn(role, userId);
    const who =
      role === "admin"
        ? "Principal’s office"
        : role === "teacher"
          ? teacher(db, tid)?.name
          : role === "student"
            ? student(db, sid)?.name
            : student(db, pid)?.parent;
    toast(`Logged in as ${who}`);
    router.push(`/${role}`);
  }

  return (
    <div className="login-wrap">
      <section className="panel login">
        <div className="brand" style={{ marginBottom: 18 }}>
          <div className="crest">{crestInitials(db.school.name)}</div>
          <div style={{ minWidth: 0 }}>
            <b>{db.school.name}</b>
            <div className="muted" style={{ fontSize: ".76rem" }}>
              {db.school.board} · Academic year {db.school.year}
            </div>
          </div>
        </div>
        <span className="demo-pill">Demo mode · no password needed</span>
        <form className="form" style={{ marginTop: 18 }} onSubmit={submit}>
          <label className="f">
            Log in as
            <select value={role} onChange={(e) => isRole(e.target.value) && setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
          </label>

          {role === "admin" ? <p className="muted">You will be signed in as the Principal’s office.</p> : null}
          {role === "teacher" && db.teachers.length ? (
            <label className="f">
              Teacher
              <select value={tid} onChange={(e) => setTid(e.target.value)}>
                {db.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {role === "student" && db.students.length ? (
            <label className="f">
              Student
              <select value={sid} onChange={(e) => setSid(e.target.value)}>
                <StudentOptionsFlat />
              </select>
            </label>
          ) : null}
          {role === "parent" && db.students.length ? (
            <label className="f">
              Parent
              <select value={pid} onChange={(e) => setPid(e.target.value)}>
                <StudentOptions db={db} asParent />
              </select>
            </label>
          ) : null}
          {missing ? <p className="muted">{missing}</p> : null}

          <button type="submit" className="btn primary block" disabled={!!missing}>
            Log in
          </button>
        </form>
      </section>
    </div>
  );
}

/** Students grouped by class, shown as "10-A · Amn Shetty". */
function StudentOptionsFlat() {
  const db = useDb();
  const groups = new Map<string, typeof db.students>();
  db.students.forEach((s) => groups.set(s.cls, [...(groups.get(s.cls) ?? []), s]));
  return [...groups.entries()]
    .sort(([a], [b]) => Number(a.split("-")[0]) - Number(b.split("-")[0]) || a.localeCompare(b))
    .map(([cls, list]) => (
      <optgroup key={cls} label={`Class ${cls}`}>
        {list.map((s) => (
          <option key={s.id} value={s.id}>
            {cls} · {s.name}
          </option>
        ))}
      </optgroup>
    ));
}
