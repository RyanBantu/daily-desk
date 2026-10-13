"use client";

import { attStats, classSubjects, student, subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import type { Mark } from "@/lib/types";
import { MARK_LABEL, fmtDateL } from "@/lib/utils";
import { Empty, Panel } from "./Panel";
import { Pill } from "./Pill";
import { StatRow } from "./StatRow";

const markTone = { P: "ok", A: "bad", L: "warn" } as const;

/** Overall stats, by-subject bars and recent periods for one student. */
export function AttendanceSummary({ sid }: { sid: string }) {
  const db = useDb();
  const s = student(db, sid);
  if (!s) return null;
  const all = attStats(db, sid);
  const subs = classSubjects(db, s.cls);
  const log: { sub: string; d: string; v: Mark }[] = [];
  Object.entries(db.attendance).forEach(([k, rec]) => {
    const [c, sub, d] = k.split("|");
    if (c === s.cls && rec[sid]) log.push({ sub, d, v: rec[sid] });
  });
  log.sort((a, b) => b.d.localeCompare(a.d) || a.sub.localeCompare(b.sub));

  return (
    <>
      <StatRow
        items={[
          { label: "Overall", value: all.pct ?? "—", unit: "%", caption: "School minimum 75%" },
          { label: "Present", value: all.p, caption: "periods" },
          { label: "Late", value: all.l, caption: "periods" },
          { label: "Absent", value: all.a, caption: "periods" },
        ]}
      />
      <div className="grid2">
        <Panel title="By subject">
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Attendance</th>
                  <th className="r">P / L / A</th>
                </tr>
              </thead>
              <tbody>
                {subs.length ? (
                  subs.map((sub) => {
                    const st = attStats(db, sid, sub);
                    const lo = st.pct != null && st.pct < 75;
                    return (
                      <tr key={sub}>
                        <td>{subj(db, sub).name}</td>
                        <td>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div className={`bar${lo ? " lo" : ""}`} style={{ width: 90 }}>
                              <i style={{ width: `${st.pct ?? 0}%` }} />
                            </div>
                            <span className="mono">{st.pct ?? "—"}%</span>
                          </div>
                        </td>
                        <td className="num">
                          {st.p} / {st.l} / {st.a}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="muted">
                      No timetable yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Recent periods">
          <div className="list">
            {log.length ? (
              log.slice(0, 10).map((x) => (
                <div className="row" key={x.d + x.sub}>
                  <span className={`att ${x.v}`}>{x.v}</span>
                  <div className="grow">
                    <b>{subj(db, x.sub).name}</b>
                    <span className="muted">{fmtDateL(x.d)}</span>
                  </div>
                  <Pill tone={markTone[x.v]}>{MARK_LABEL[x.v]}</Pill>
                </div>
              ))
            ) : (
              <Empty>No attendance recorded yet. Subject teachers mark the register each period.</Empty>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
