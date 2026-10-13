"use client";

import { useState, type FormEvent } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { PctPill } from "@/components/Pill";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { toast } from "@/components/Toast";
import { useTeacher } from "@/lib/hooks";
import { attStats, avgPct, classStudents, classTeacherOf, rollOf } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { formValues, uid } from "@/lib/utils";

export default function TeacherRoster() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const t = useTeacher();
  const [rosterCls, setRosterCls] = useState("");
  const ct = classTeacherOf(db, t?.id);

  if (!ct.length)
    return (
      <>
        <PageHead eyebrow={PORTAL_LABEL.teacher} title="My class roster" />
        <Empty>You are not a class teacher this year. The school office assigns class teachers from the Admin portal.</Empty>
      </>
    );

  const cls = ct.includes(rosterCls) ? rosterCls : ct[0];
  const kids = classStudents(db, cls);

  function addStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    mutate((d) => {
      d.students.push({ id: "s" + uid(), cls, name: g("name"), parent: g("parent"), phone: g("phone") });
    });
    toast(`${g("name")} added to ${cls}`);
    form.reset();
  }

  return (
    <>
      <PageHead
        eyebrow={`Class teacher · ${cls}`}
        title={`Class ${cls} roster`}
        sub="As class teacher you add the students in your section. Roll numbers follow the order of the list."
        right={
          ct.length > 1 ? (
            <div className="chips">
              {ct.map((c) => (
                <button key={c} type="button" className="chip" aria-pressed={c === cls} onClick={() => setRosterCls(c)}>
                  {c}
                </button>
              ))}
            </div>
          ) : null
        }
      />
      <Panel title="Add a student">
        <form className="form" onSubmit={addStudent}>
          <div className="fr">
            <label className="f">
              Student name
              <input type="text" name="name" required placeholder="Full name" />
            </label>
            <label className="f">
              Parent / guardian
              <input type="text" name="parent" required placeholder="Full name" />
            </label>
            <label className="f">
              Parent phone
              <input type="tel" name="phone" placeholder="+91 98…" />
            </label>
          </div>
          <div className="actions">
            <button className="btn primary" type="submit">
              Add to {cls}
            </button>
          </div>
        </form>
      </Panel>
      <Panel title={`${kids.length} students`}>
        {kids.length ? (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th>Parent / guardian</th>
                  <th>Phone</th>
                  <th className="r">Attendance</th>
                  <th className="r">Avg score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {kids.map((s) => {
                  const av = avgPct(db, s.id);
                  return (
                    <tr key={s.id}>
                      <td className="roll">{rollOf(db, s)}</td>
                      <td>
                        <b>{s.name}</b>
                      </td>
                      <td>{s.parent}</td>
                      <td className="mono">{s.phone || "—"}</td>
                      <td className="num">
                        <PctPill pct={attStats(db, s.id).pct} />
                      </td>
                      <td className="num">{av != null ? av + "%" : "—"}</td>
                      <td className="r">
                        <ConfirmButton
                          onConfirm={() => {
                            mutate((d) => {
                              d.students = d.students.filter((x) => x.id !== s.id);
                            });
                            toast("Student removed");
                          }}
                        >
                          Remove
                        </ConfirmButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No students yet. Add the first one above.</Empty>
        )}
      </Panel>
    </>
  );
}
