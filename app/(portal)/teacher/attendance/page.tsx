"use client";

import { useState } from "react";
import { AttendanceToggle } from "@/components/AttendanceToggle";
import { Empty, Panel } from "@/components/Panel";
import { PctPill, Pill } from "@/components/Pill";
import { NoClasses, TeacherHead } from "@/components/TeacherHead";
import { toast } from "@/components/Toast";
import { useTeacherCtx } from "@/lib/hooks";
import { attStats, classStudents, rollOf, tName } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import type { Mark } from "@/lib/types";
import { PERIODS, fmtDate, fmtDateL, today, weekdayKey } from "@/lib/utils";

export default function TeacherAttendance() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const { cls, sub } = useTeacherCtx();
  const [attDate, setAttDate] = useState(today);
  const [draft, setDraft] = useState<{ key: string; marks: Record<string, Mark> } | null>(null);

  if (!cls) return (<><TeacherHead title="Attendance" /><NoClasses /></>);

  const key = `${cls}|${sub}|${attDate}`;
  const saved = db.attendance[key];
  const kids = classStudents(db, cls);
  const marks: Record<string, Mark> =
    draft?.key === key ? draft.marks : { ...Object.fromEntries(kids.map((s) => [s.id, "P" as Mark])), ...saved };
  const c = { P: 0, A: 0, L: 0 };
  kids.forEach((s) => c[marks[s.id] || "P"]++);
  const wd = weekdayKey(attDate);
  const ps = wd ? PERIODS.map((_, i) => i + 1).filter((p) => db.timetable[cls]?.[`${wd}-${p}`]?.subject === sub) : [];
  const dates = [...new Set(Object.keys(db.attendance).filter((k) => k.startsWith(cls + "|" + sub + "|")).map((k) => k.split("|")[2]))]
    .sort()
    .slice(-8);

  function saveRegister() {
    mutate((d) => {
      d.attendance[key] = { ...marks };
    });
    setDraft(null);
    toast(`Register saved for ${fmtDateL(attDate)}`);
  }

  return (
    <>
      <TeacherHead title="Attendance register" sub="P present, A absent, L late. Each student’s running percentage for your subject is on the right." />
      {kids.length ? (
        <>
          <Panel
            title={
              <div className="actions">
                <label className="f" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Date
                  <input type="date" value={attDate} max={today()} onChange={(e) => setAttDate(e.target.value || today())} style={{ width: "auto" }} />
                </label>
                <span className="muted">{ps.length ? `Period ${ps.join(", ")} on the timetable` : "No period for this class on this day"}</span>
              </div>
            }
            right={saved ? <Pill tone="ok">Saved</Pill> : <Pill tone="warn">Not saved</Pill>}
          >
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Roll</th>
                    <th>Student</th>
                    <th>Mark</th>
                    <th className="r">Subject %</th>
                  </tr>
                </thead>
                <tbody>
                  {kids.map((s) => (
                    <tr key={s.id}>
                      <td className="roll">{rollOf(db, s)}</td>
                      <td>{s.name}</td>
                      <td>
                        <AttendanceToggle label={s.name} value={marks[s.id]} onChange={(v) => setDraft({ key, marks: { ...marks, [s.id]: v } })} />
                      </td>
                      <td className="num">
                        <PctPill pct={attStats(db, s.id, sub).pct} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="actions" style={{ marginTop: 14, justifyContent: "space-between" }}>
              <div className="actions mono" style={{ fontSize: ".84rem" }}>
                <span style={{ color: "var(--ok)" }}>P {c.P}</span>
                <span style={{ color: "var(--bad)" }}>A {c.A}</span>
                <span style={{ color: "var(--warn)" }}>L {c.L}</span>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setDraft({ key, marks: Object.fromEntries(kids.map((s) => [s.id, "P" as Mark])) })}
                >
                  Mark all present
                </button>
                <button type="button" className="btn primary" onClick={saveRegister}>
                  Save register
                </button>
              </div>
            </div>
          </Panel>
          <Panel title="Recent periods">
            {dates.length ? (
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      {dates.map((d) => (
                        <th className="r" key={d}>
                          {fmtDate(d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kids.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        {dates.map((d) => {
                          const v = db.attendance[`${cls}|${sub}|${d}`]?.[s.id];
                          return (
                            <td className="num" key={d}>
                              <span className={`att ${v || "x"}`}>{v || "·"}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No periods recorded yet. Saved registers appear here.</Empty>
            )}
          </Panel>
        </>
      ) : (
        <Empty>
          No students in {cls} yet. The class teacher ({tName(db, db.classTeacher[cls])}) adds them from “My class roster”.
        </Empty>
      )}
    </>
  );
}
