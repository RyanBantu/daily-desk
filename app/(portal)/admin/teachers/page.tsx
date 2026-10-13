"use client";

import type { FormEvent } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageHead } from "@/components/PageHead";
import { Panel } from "@/components/Panel";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { SubjectCode } from "@/components/SubjectCode";
import { toast } from "@/components/Toast";
import { classTeacherOf, periodsPerWeek } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { formValues, uid } from "@/lib/utils";

export default function AdminTeachers() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);

  function addTeacher(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { fd, g } = formValues(form);
    const subs = fd.getAll("subjects").map(String);
    mutate((d) => {
      d.teachers.push({ id: "t" + uid(), name: g("name"), email: g("email"), subjects: subs });
    });
    toast(`${g("name")} added${subs.length ? "" : ". Pick the subjects they head in the table"}`);
    form.reset();
  }

  function addSubject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    const code = g("code").toUpperCase();
    const id = code.toLowerCase();
    if (db.subjects.some((s) => s.id === id)) return toast("A subject with that code already exists.");
    mutate((d) => {
      d.subjects.push({ id, name: g("name"), code });
    });
    toast("Subject added");
    form.reset();
  }

  function toggleSubject(tid: string, sid: string) {
    mutate((d) => {
      const t = d.teachers.find((x) => x.id === tid);
      if (t) t.subjects = t.subjects.includes(sid) ? t.subjects.filter((x) => x !== sid) : [...t.subjects, sid];
    });
  }

  function removeTeacher(tid: string) {
    mutate((d) => {
      d.teachers = d.teachers.filter((t) => t.id !== tid);
      Object.keys(d.classTeacher).forEach((c) => {
        if (d.classTeacher[c] === tid) delete d.classTeacher[c];
      });
      Object.values(d.timetable).forEach((tt) =>
        Object.keys(tt).forEach((k) => {
          if (tt[k].teacher === tid) delete tt[k];
        }),
      );
    });
    toast("Teacher removed, with their periods");
  }

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Teachers & subjects"
        sub="Add staff and set the subjects each teacher heads. Only these teachers can be scheduled for a subject in the timetable."
      />
      <Panel title="Add a teacher">
        <form className="form" onSubmit={addTeacher}>
          <div className="fr">
            <label className="f">
              Full name
              <input type="text" name="name" placeholder="e.g. Mrs. Sunita Rao" required />
            </label>
            <label className="f">
              Email
              <input type="email" name="email" placeholder="name@school.edu.in" />
            </label>
          </div>
          <div className="f">
            Subjects they head
            <div className="chips" style={{ marginTop: 6 }}>
              {db.subjects.map((s) => (
                <label className="check chip" key={s.id}>
                  <input type="checkbox" name="subjects" value={s.id} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div className="actions">
            <button className="btn primary" type="submit">
              Add teacher
            </button>
          </div>
        </form>
      </Panel>

      <Panel title={`Staff (${db.teachers.length})`} right={<span className="muted">Click a subject to switch it on or off</span>}>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subjects headed</th>
                <th>Class teacher of</th>
                <th className="r">Periods / wk</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {db.teachers.map((t) => {
                const ct = classTeacherOf(db, t.id);
                return (
                  <tr key={t.id}>
                    <td>
                      <b>{t.name}</b>
                      <div className="muted">{t.email}</div>
                    </td>
                    <td>
                      <div className="sub-toggle">
                        {db.subjects.map((s) => (
                          <button key={s.id} type="button" className="chip sm" aria-pressed={t.subjects.includes(s.id)} onClick={() => toggleSubject(t.id, s.id)}>
                            {s.code}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      {ct.length ? (
                        <span className="actions" style={{ gap: 4 }}>
                          {ct.map((c) => (
                            <SubjectCode key={c}>{c}</SubjectCode>
                          ))}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="num">{periodsPerWeek(db, t.id)}</td>
                    <td className="r">
                      <ConfirmButton onConfirm={() => removeTeacher(t.id)}>Remove</ConfirmButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Subjects">
        <form className="form" onSubmit={addSubject}>
          <div className="fr">
            <label className="f">
              Subject name
              <input type="text" name="name" placeholder="e.g. Chemistry" required />
            </label>
            <label className="f">
              Short code
              <input type="text" name="code" placeholder="CHE" maxLength={4} required />
            </label>
          </div>
          <div className="actions">
            <button className="btn ghost" type="submit">
              Add subject
            </button>
            <span className="muted">{db.subjects.map((s) => s.name).join(" · ")}</span>
          </div>
        </form>
      </Panel>
    </>
  );
}
