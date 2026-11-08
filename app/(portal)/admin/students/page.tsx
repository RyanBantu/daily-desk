"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { PctPill } from "@/components/Pill";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { feeBalance, feesFor } from "@/lib/fees";
import { attStats, avgPct, rollOf } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { inr } from "@/lib/utils";

export default function AdminStudents() {
  const db = useDb();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return db.students
      .filter((s) => !needle || `${s.name} ${s.parent} ${s.cls}`.toLowerCase().includes(needle))
      .sort((a, b) => a.cls.localeCompare(b.cls) || a.name.localeCompare(b.name));
  }, [db.students, q]);

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Student records"
        sub="Every enrolled student, the parent account they are linked to, attendance, scores and fees outstanding. Class teachers add names from the register."
        right={
          <label className="f" style={{ minWidth: 220 }}>
            Search
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, parent or class" />
          </label>
        }
      />
      <Panel>
        {rows.length ? (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Roll</th>
                  <th>Student</th>
                  <th>Linked parent</th>
                  <th>Phone</th>
                  <th className="r">Attendance</th>
                  <th className="r">Avg score</th>
                  <th className="r">Fees due</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const due = feesFor(db, s.id).reduce((n, f) => n + feeBalance(f), 0);
                  const av = avgPct(db, s.id);
                  return (
                    <tr key={s.id}>
                      <td>{s.cls}</td>
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
                      <td className="num">{due ? inr(due) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No students match that search.</Empty>
        )}
      </Panel>
    </>
  );
}
