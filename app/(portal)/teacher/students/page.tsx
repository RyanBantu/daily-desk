"use client";

import { Fragment, useState, type FormEvent } from "react";
import { Empty, Panel } from "@/components/Panel";
import { PctPill, Pill } from "@/components/Pill";
import { RemarkList } from "@/components/RemarkList";
import { NoClasses, TeacherHead } from "@/components/TeacherHead";
import { toast } from "@/components/Toast";
import { useTeacherCtx } from "@/lib/hooks";
import { attStats, avgPct, cbse, classStudents, levelTone, rollOf, subFor } from "@/lib/selectors";
import { pushMessage, useDb, useStore } from "@/lib/store";
import type { Level } from "@/lib/types";
import { LEVELS, formValues, today, uid } from "@/lib/utils";

export default function TeacherStudents() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const { cls, sub, tid } = useTeacherCtx();
  const [open, setOpen] = useState<string | null>(null);
  if (!cls) return (<><TeacherHead title="Performance & remarks" /><NoClasses /></>);

  const kids = classStudents(db, cls);
  const hws = db.homework.filter((h) => h.cls === cls && h.subject === sub);
  const rem = db.remarks.filter((r) => r.subject === sub && kids.some((k) => k.id === r.sid)).sort((a, b) => b.date.localeCompare(a.date));

  function addRemark(e: FormEvent<HTMLFormElement>, sid: string) {
    e.preventDefault();
    const { fd, g } = formValues(e.currentTarget);
    const share = fd.get("share") === "on";
    const level = g("level") as Level;
    const text = g("text");
    mutate((d) => {
      d.remarks.push({ id: uid(), sid, tid, subject: sub!, level, text, date: today(), shared: share });
      if (share) pushMessage(d, { sid, tid, subject: sub!, kind: "Remark", title: `${level} — remark from class`, body: text });
    });
    setOpen(null);
    toast(share ? "Remark saved and sent to parent" : "Remark saved");
  }

  function shareRemark(id: string) {
    mutate((d) => {
      const r = d.remarks.find((x) => x.id === id);
      if (!r) return;
      r.shared = true;
      pushMessage(d, { sid: r.sid, tid: r.tid, subject: r.subject, kind: "Remark", title: `${r.level} — remark from class`, body: r.text });
    });
    toast("Remark sent to parent");
  }

  return (
    <>
      <TeacherHead title="Performance & remarks" sub="How each student is doing in your subject. Write a remark and choose whether the parent gets it." />
      <Panel>
        {kids.length ? (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th className="r">Attendance</th>
                  <th className="r">Avg score</th>
                  <th className="r">Homework</th>
                  <th>Latest remark</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {kids.map((s) => {
                  const av = avgPct(db, s.id, sub);
                  const done = hws.filter((h) => subFor(db, h.id, s.id)).length;
                  const last = rem.find((r) => r.sid === s.id);
                  return (
                    <Fragment key={s.id}>
                      <tr>
                        <td className="roll">{rollOf(db, s)}</td>
                        <td>
                          <b>{s.name}</b>
                        </td>
                        <td className="num">
                          <PctPill pct={attStats(db, s.id, sub).pct} />
                        </td>
                        <td className="num">{av != null ? `${av}% · ${cbse(av)}` : "—"}</td>
                        <td className="num">
                          {done}/{hws.length}
                        </td>
                        <td>{last ? <Pill tone={levelTone(last.level)}>{last.level}</Pill> : <span className="muted">—</span>}</td>
                        <td className="r">
                          <button type="button" className="btn ghost sm" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
                            {open === s.id ? "Close" : "Write remark"}
                          </button>
                        </td>
                      </tr>
                      {open === s.id ? (
                        <tr>
                          <td />
                          <td colSpan={6} className="wrap">
                            <form className="form inset" onSubmit={(e) => addRemark(e, s.id)}>
                              <div className="fr">
                                <label className="f">
                                  Performance
                                  <select name="level" defaultValue="Good">
                                    {LEVELS.map((l) => (
                                      <option key={l} value={l}>
                                        {l}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                              <label className="f">
                                Remark
                                <textarea name="text" rows={3} required placeholder="Progress, strengths, what to work on" />
                              </label>
                              <div className="actions">
                                <label className="check">
                                  <input type="checkbox" name="share" defaultChecked /> Send to {s.parent} (parent)
                                </label>
                                <button className="btn primary sm" type="submit">
                                  Save remark
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No students in this class yet. The class teacher adds them from My class roster.</Empty>
        )}
      </Panel>
      <Panel title="Remarks written">
        <RemarkList list={rem} onShare={shareRemark} emptyMsg="No remarks yet. Use “Write remark” in the table above." />
      </Panel>
    </>
  );
}
