"use client";

import { Legend, LineChart, S1 } from "@/components/charts";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { PctPill } from "@/components/Pill";
import { PORTAL_LABEL } from "@/components/Sidebar";
import * as A from "@/lib/analytics";
import { allClasses, attByDay, attPct, classStudents, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";

export default function AdminAttendance() {
  const db = useDb();
  const cls = allClasses(db).filter((c) => classStudents(db, c).length);
  const daily = A.dailyAtt(db, () => true).slice(-12);
  const schoolPct = A.aggPct(daily);

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Attendance"
        sub="Whole-school registers. Teachers mark each period; this page rolls them up by section. The school minimum is 75%."
      />
      <Panel
        title="School"
        note={schoolPct != null ? `Average ${schoolPct}% over the last ${daily.length} school days` : "No registers yet"}
        right={<Legend items={[{ label: "Attendance", color: S1 }, { label: "75% minimum", color: "var(--bad)", dashed: true }]} />}
      >
        {daily.length ? (
          <LineChart
            labels={daily.map((x) => A.fmtDate(x.d))}
            tipLabels={daily.map((x) => A.fmtDateLong(x.d))}
            series={[{ name: "Attendance", color: S1, values: daily.map((x) => x.pct) }]}
            min={50}
            max={100}
            ticks={[50, 60, 70, 80, 90, 100]}
            unit="%"
            refLine={{ value: 75, label: "75% minimum" }}
            fmt={(v) => `${A.r1(v)}%`}
            height={220}
            label="Daily attendance"
          />
        ) : (
          <Empty>Teachers have not marked attendance yet.</Empty>
        )}
      </Panel>
      <Panel title="By section">
        {cls.length ? (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Class teacher</th>
                  <th className="r">On roll</th>
                  <th className="r">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {cls.map((c) => {
                  const days = attByDay(db, (clsName) => clsName === c);
                  return (
                    <tr key={c}>
                      <td>
                        <b>{c}</b>
                      </td>
                      <td>{tName(db, db.classTeacher[c])}</td>
                      <td className="num">{classStudents(db, c).length}</td>
                      <td className="num">
                        <PctPill pct={attPct(days) != null ? Math.round(attPct(days)!) : null} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No sections have students yet.</Empty>
        )}
      </Panel>
    </>
  );
}
