"use client";

import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { PctPill, Pill } from "@/components/Pill";
import { PORTAL_LABEL } from "@/components/Sidebar";
import * as A from "@/lib/analytics";
import { feeBalance, feeStatus, feeTotals } from "@/lib/fees";
import { allClasses, attByDay, attPct, attStats, classStudents, handIn, subj, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { GRADES, inr } from "@/lib/utils";

export default function AdminReports() {
  const db = useDb();
  const cls = allClasses(db);
  const withKids = cls.filter((c) => classStudents(db, c).length);
  const fees = feeTotals(db);
  const lowAtt = db.students
    .map((s) => ({ s, a: attStats(db, s.id).pct }))
    .filter((x) => x.a != null && x.a < 75)
    .sort((a, b) => (a.a ?? 0) - (b.a ?? 0));
  const g0 = GRADES.filter((g) => A.rounds(db, g).length).at(-1) ?? 10;
  const lr = A.rounds(db, g0).at(-1);
  const subs = lr ? [...new Set(db.exams.filter((e) => e.grade === g0 && e.name === lr).map((e) => e.subject))] : [];
  const hw = handIn(db, db.homework);
  const overdueFees = db.fees.filter((f) => feeStatus(f) === "overdue");

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Reports"
        sub="A snapshot for the principal’s office: enrolment, attendance below the 75% minimum, fee collection, and the latest exam sitting."
      />
      <div className="grid2">
        <Panel title="Enrolment by class">
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Class teacher</th>
                  <th className="r">Students</th>
                  <th className="r">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {withKids.map((c) => (
                  <tr key={c}>
                    <td>
                      <b>{c}</b>
                    </td>
                    <td>{tName(db, db.classTeacher[c])}</td>
                    <td className="num">{classStudents(db, c).length}</td>
                    <td className="num">
                      <PctPill pct={attPct(attByDay(db, (x) => x === c)) != null ? Math.round(attPct(attByDay(db, (x) => x === c))!) : null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Fee collection" note={`${inr(fees.collected)} of ${inr(fees.billed)} billed`}>
          <div className="list">
            <div className="row">
              <div className="grow">
                <b>Outstanding</b>
                <span className="muted">Including partial payments</span>
              </div>
              <div className="num">{inr(fees.outstanding)}</div>
            </div>
            <div className="row">
              <div className="grow">
                <b>Overdue lines</b>
                <span className="muted">{overdueFees.length} charges past due</span>
              </div>
              <div className="num">{inr(overdueFees.reduce((n, f) => n + feeBalance(f), 0))}</div>
            </div>
            <div className="row">
              <div className="grow">
                <b>Homework hand-in</b>
                <span className="muted">
                  {hw.done} of {hw.expected} expected
                </span>
              </div>
              <PctPill pct={hw.pct} />
            </div>
          </div>
        </Panel>
      </div>
      <div className="grid2">
        <Panel title="Attendance below 75%">
          {lowAtt.length ? (
            <div className="list tight">
              {lowAtt.map(({ s, a }) => (
                <div className="row" key={s.id}>
                  <div className="grow">
                    <b>{s.name}</b>
                    <span className="muted">
                      Class {s.cls} · {s.parent}
                    </span>
                  </div>
                  <PctPill pct={a} />
                </div>
              ))}
            </div>
          ) : (
            <Empty>Every student on roll meets the minimum.</Empty>
          )}
        </Panel>
        <Panel title={lr ? `${lr} · Class ${g0}` : "Latest exam"} note="Section averages on the most recent sitting">
          {lr && subs.length ? (
            <div className="list tight">
              {subs.map((sub) => {
                const pct = A.roundPct(db, db.students.filter((s) => A.gradeOf(s.cls) === g0).map((s) => s.id), g0, lr, sub);
                return (
                  <div className="row" key={sub}>
                    <div className="grow">
                      <b>{subj(db, sub).name}</b>
                    </div>
                    <span className="num">{pct != null ? `${Math.round(pct)}%` : "—"}</span>
                    {pct != null ? <Pill tone="mute">{A.cbse(pct)}</Pill> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty>No marked exams yet.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
