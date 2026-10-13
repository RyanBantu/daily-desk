"use client";

import { FormEvent, Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ready } from "@/components/StoreBoot";
import {
  type Role,
  ROLES,
  ROLE_LABEL,
  DEMO_PASSWORDS,
  checkDemoPassword,
  isRole,
} from "@/lib/demo-auth";
import { useDb, useStore } from "@/lib/store";
import { crestInitials, firstName } from "@/lib/utils";

type Option = { value: string; label: string; group?: string };

export default function LoginPage() {
  return (
    <Ready>
      <Suspense fallback={null}>
        <LoginFromQuery />
      </Suspense>
    </Ready>
  );
}

function LoginFromQuery() {
  const params = useSearchParams();
  const initialRole: Role = isRole(params.get("role")) ? (params.get("role") as Role) : "admin";
  return <LoginForm key={initialRole} initialRole={initialRole} />;
}

function LoginForm({ initialRole }: { initialRole: Role }) {
  const router = useRouter();
  const db = useDb();
  const signIn = useStore((s) => s.signIn);

  const [role, setRole] = useState<Role>(initialRole);
  const [userPick, setUserPick] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  const people: Option[] = useMemo(() => {
    if (role === "teacher") return db.teachers.map((t) => ({ value: t.id, label: t.name }));
    if (role === "student")
      return db.students.map((s) => ({ value: s.id, label: s.name, group: `Class ${s.cls}` }));
    if (role === "parent")
      return db.students.map((s) => ({
        value: s.id,
        label: `${s.parent} (parent of ${firstName(s.name)})`,
        group: `Class ${s.cls}`,
      }));
    return [];
  }, [role, db.teachers, db.students]);

  const userId = role === "admin" ? "admin" : people.some((p) => p.value === userPick) ? userPick : (people[0]?.value ?? "");

  function changeRole(r: Role) {
    setRole(r);
    setUserPick("");
    setPassword("");
    setError("");
  }

  function fillDemo(r: Role) {
    setRole(r);
    setUserPick("");
    setPassword(DEMO_PASSWORDS[r]);
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (role !== "admin" && !userId) {
      setError("Choose who you are logging in as.");
      return;
    }
    if (!checkDemoPassword(role, password)) {
      setError(`That password doesn't match the ${ROLE_LABEL[role]} account. Check the demo passwords below.`);
      pwRef.current?.focus();
      return;
    }
    setError("");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    signIn(role, userId);
    router.push(`/${role}`);
  }

  const groups = useMemo(() => {
    const map = new Map<string, Option[]>();
    people.forEach((p) => {
      const g = p.group ?? "";
      map.set(g, [...(map.get(g) ?? []), p]);
    });
    return [...map.entries()];
  }, [people]);

  const whoLabel = role === "teacher" ? "Teacher" : role === "student" ? "Student" : "Parent";
  const school = db.school;

  return (
    <main className="login-page">
      <section className="login-banner" aria-label="Daily Desk">
        <div className="login-banner-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/daily-desk-mark-reverse.svg"
            width={64}
            height={64}
            alt=""
            aria-hidden
          />
          <div>
            <p className="login-banner-name">
              <span>D</span>aily <span>D</span>esk
            </p>
            <p className="login-banner-kicker">School management portal</p>
          </div>
        </div>
        <div className="login-banner-mid">
          <h1>
            Your whole school, <em>one desk.</em>
          </h1>
          <ul className="login-banner-points">
            <li>
              <Tick />
              Attendance, homework, exam scores and remarks in one place
            </li>
            <li>
              <Tick />
              Timetables, course plans and exam datesheets for every class
            </li>
            <li>
              <Tick />
              Parents see scores and teacher remarks the same day
            </li>
          </ul>
        </div>
        <div className="login-banner-tags">
          <span>Admin</span>
          <span>Teachers</span>
          <span>Students</span>
          <span>Parents</span>
        </div>
      </section>
      <div className="login-panel">
        <form className="login-card" onSubmit={onSubmit} noValidate>
        <div className="login-brand">
          <div className="crest" aria-hidden>
            {crestInitials(school.name)}
          </div>
          <div>
            <h1>{school.name}</h1>
            <p>
              {school.board} · Academic year {school.year}
            </p>
          </div>
        </div>
        <span className="login-pill">Demo mode · sample data only</span>

        <label className="login-field" htmlFor="role">
          Log in as
          <select id="role" value={role} onChange={(e) => isRole(e.target.value) && changeRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>

        {role !== "admin" && (
          <label className="login-field" htmlFor="who">
            {whoLabel}
            <select id="who" value={userId} onChange={(e) => setUserPick(e.target.value)}>
              {groups.map(([g, opts]) =>
                g ? (
                  <optgroup key={g} label={g}>
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  opts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))
                ),
              )}
            </select>
          </label>
        )}

        <label className="login-field" htmlFor="password">
          Password
          <div className={`pw-wrap ${error ? "invalid" : ""}`}>
            <input
              id="password"
              ref={pwRef}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "pw-error" : undefined}
              placeholder={`${ROLE_LABEL[role]} password`}
            />
            <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {error && (
            <span id="pw-error" className="login-error" role="alert">
              {error}
            </span>
          )}
        </label>

        <button className="login-submit" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>

        <div className="demo-hints">
          <button type="button" className="hint-toggle" onClick={() => setHintsOpen((v) => !v)} aria-expanded={hintsOpen}>
            {hintsOpen ? "Hide demo passwords" : "Show demo passwords"}
          </button>
          {hintsOpen && (
            <table>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r}>
                    <td>{ROLE_LABEL[r]}</td>
                    <td className="mono">{DEMO_PASSWORDS[r]}</td>
                    <td className="r">
                      <button type="button" onClick={() => fillDemo(r)}>
                        Use
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </form>
      </div>
    </main>
  );
}

function Tick() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M3.2 8.3 6.4 11.4 12.8 4.6" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
