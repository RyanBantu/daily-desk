"use client";

import Link from "next/link";
import { ColumnChart, HBars, Legend, LineChart, Ring, S1 } from "@/components/charts";
import { NoticeList } from "@/components/NoticeList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { PORTAL_LABEL, hrefFor } from "@/components/Sidebar";
import { KpiRow } from "@/components/kpi-row";
import { SubjectCode } from "@/components/SubjectCode";
import * as A from "@/lib/analytics";
import { allClasses, attByDay, attPct, cbse, classStudents, handIn, rounds, roundAvg, shortNameOf, shortRound, subj, teacher } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { GRADES, fmtDateL, initials, shortName, today } from "@/lib/utils";

export default function AdminOverview() {
  const db = useDb();
  const cls = allClasses(db);
  const withRoster = cls.filter((c) => classStudents(db, c).length).length;
  const days = attByDay(db, () => true);
  const lastDay = days.at(-1);
  const schoolRounds = rounds(db, db.exams.filter((e) => !e.cls));
  const latest = schoolRounds[0];
  const prev = schoolRounds.find((r) => r !== latest && r.grade === latest?.grade);
  const latestAvg = roundAvg(db, latest);
  const hw = handIn(db, db.homework);
  const issues: [string, string, string][] = [];
  cls.forEach((c) => {
    if (!db.classTeacher[c]) issues.push([c, "No class teacher assigned", "classes"]);
    else if (!classStudents(db, c).length) issues.push([c, `${shortNameOf(db, db.classTeacher[c])} has not added students yet`, "classes"]);
    if (!Object.keys(db.timetable[c] || {}).length) issues.push([c, "Timetable is empty", "timetable"]);
  });
  db.teachers.filter((t) => !t.subjects.length).forEach((t) => issues.push([t.name, "No subjects assigned", "teachers"]));
  const up = db.exams
    .filter((e) => e.date >= today() && !e.cls)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const withKids = cls.filter((c) => classStudents(db, c).length);
  const assigned = cls.filter((c) => db.classTeacher[c] && teacher(db, db.classTeacher[c])).length;
  const daily = A.dailyAtt(db, () => true).slice(-12);
  const g0 = GRADES.filter((g) => A.rounds(db, g).length).at(-1) ?? 10;
  const rs = A.rounds(db, g0);
  const lr = rs.at(-1);
  const pr = rs.at(-2);
  const sidsG = db.students.filter((s) => A.gradeOf(s.cls) === g0).map((s) => s.id);
  const dist = lr ? A.gradeDist(db, sidsG, g0, lr) : [];
  const distMax = Math.max(4, Math.ceil(Math.max(0, ...dist) / 4) * 4);
  const distN = dist.reduce((a, b) => a + b, 0);
  const subs = lr ? [...new Set(db.exams.filter((e) => e.grade === g0 && e.name === lr).map((e) => e.subject))] : [];
  const atRisk = db.students
    .map((s) => ({ s, a: A.attStats(db, s.id).pct, v: A.avgPct(db, s.id) }))
    .filter((x) => (x.a != null && x.a < 75) || (x.v != null && x.v < 50));

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title={db.school.name}
        sub={`Academic year ${db.school.year} · Classes ${GRADES[0]}–${GRADES[GRADES.length - 1]}`}
      />
      <KpiRow
        items={[
          {
            label: "Students enrolled",
            value: db.students.length,
            caption: `${withRoster} of ${cls.length} sections have rosters`,
          },
          {
            label: "Attendance",
            value: lastDay ? attPct([lastDay])!.toFixed(1) : "—",
            unit: lastDay ? "%" : undefined,
            caption: lastDay ? `On ${fmtDateL(lastDay.date)} · school minimum 75%` : "No registers yet",
            delta: { current: attPct(days.slice(-5)), previous: attPct(days.slice(-10, -5)), label: "vs previous week" },
          },
          {
            label: "Average score",
            value: latestAvg != null ? Math.round(latestAvg) : "—",
            unit: latestAvg != null ? "%" : undefined,
            caption: latest && latestAvg != null ? `${latest.name} · Class ${latest.grade} · grade ${cbse(latestAvg)}` : "No marks yet",
            delta: { current: latestAvg, previous: roundAvg(db, prev), label: prev ? `vs ${shortRound(prev.name)}` : undefined },
          },
          {
            label: "Homework handed in",
            value: hw.pct ?? "—",
            unit: hw.pct != null ? "%" : undefined,
            caption: hw.expected ? `${hw.done} of ${hw.expected} expected submissions` : "No homework set yet",
          },
        ]}
      />

      <div className="grid2 dash wide">
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Daily attendance</h3>
              <p className="muted">
                All periods, all sections · last {daily.length} school days · average {A.pctTxt(A.aggPct(daily))}
              </p>
            </div>
            <Legend items={[{ label: "Attendance", color: S1 }, { label: "75% minimum", color: "var(--bad)", dashed: true }]} />
          </div>
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
              height={240}
              label="Daily attendance"
            />
          ) : (
            <Empty>No registers recorded yet.</Empty>
          )}
        </section>
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Grade distribution</h3>
              <p className="muted">{lr ? `${lr} · Class ${g0} · ${distN} papers` : "No marks yet"}</p>
            </div>
          </div>
          {lr ? (
            <ColumnChart
              labels={[...A.BANDS]}
              series={[{ name: "Papers", color: S1, values: dist }]}
              max={distMax}
              ticks={[0, distMax / 4, distMax / 2, (3 * distMax) / 4, distMax]}
              fmt={(v) => v}
              labelFirst
              height={240}
              label="Grade distribution"
            />
          ) : (
            <Empty>No marks yet.</Empty>
          )}
        </section>
      </div>

      <div className="grid2 dash">
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Average score by subject</h3>
              <p className="muted">{lr ? `${lr} · Class ${g0}. Tick marks ${pr ?? ""}` : "No marks yet"}</p>
            </div>
          </div>
          {lr ? (
            <HBars
              rows={subs
                .map((x) => {
                  const v = A.roundPct(db, sidsG, g0, lr, x);
                  const p = pr ? A.roundPct(db, sidsG, g0, pr, x) : null;
                  return {
                    label: A.subjectOf(db, x).name,
                    value: v,
                    compare: p,
                    display: A.pctTxt(v),
                    tone: v != null && v < 50 ? ("bad" as const) : undefined,
                    tip: `${A.subjectOf(db, x).name}\n${lr}: ${A.pctTxt(v)}${p != null ? `\n${pr}: ${A.pctTxt(p)}` : ""}`,
                  };
                })
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))}
            />
          ) : (
            <Empty>No marks yet.</Empty>
          )}
        </section>
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Teacher workload</h3>
              <p className="muted">Periods per week out of 30</p>
            </div>
          </div>
          <HBars
            rows={db.teachers
              .map((t) => {
                const n = A.periodsPerWeek(db, t.id);
                return {
                  label: shortName(t.name),
                  value: n,
                  max: 30,
                  display: `${n}/30`,
                  tone: n > 24 ? ("warn" as const) : undefined,
                  tip: `${t.name}\n${n} periods a week\n${t.subjects.map((x) => subj(db, x).name).join(", ") || "No subjects"}`,
                };
              })
              .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))}
          />
        </section>
      </div>

      <div className="grid2 dash wide">
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Section comparison</h3>
              <p className="muted">Sections with students on roll</p>
            </div>
          </div>
          {withKids.length ? (
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th className="r">Students</th>
                    <th>Attendance</th>
                    <th className="r">Avg score</th>
                    <th className="r">Homework</th>
                    <th>Class teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {withKids.map((c) => {
                    const ids = classStudents(db, c).map((s) => s.id);
                    const a = A.aggPct(A.dailyAtt(db, (x) => x === c));
                    const v = lr && A.gradeOf(c) === g0 ? A.roundPct(db, ids, g0, lr) : null;
                    const h = A.hwCounts(db, c).pct;
                    return (
                      <tr key={c}>
                        <td>
                          <b>{c}</b>
                        </td>
                        <td className="num">{ids.length}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className={`bar${a != null && a < 75 ? " lo" : ""}`} style={{ width: 70 }}>
                              <i style={{ width: `${a ?? 0}%` }} />
                            </div>
                            <span className="mono">{A.pctTxt(a)}</span>
                          </div>
                        </td>
                        <td className="num">{A.pctTxt(v)}</td>
                        <td className="num">{A.pctTxt(h)}</td>
                        <td>{shortNameOf(db, db.classTeacher[c])}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No students yet.</Empty>
          )}
        </section>
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Students needing support</h3>
              <p className="muted">Attendance below 75% or average below 50%</p>
            </div>
            <Pill tone={atRisk.length ? "bad" : "ok"}>{atRisk.length}</Pill>
          </div>
          <div className="list">
            {atRisk.length ? (
              atRisk.map((x) => (
                <div className="row" key={x.s.id}>
                  <div className="avatar">{initials(x.s.name)}</div>
                  <div className="grow">
                    <b>{x.s.name}</b>
                    <span className="muted">
                      {x.s.cls} · Parent {x.s.parent} · <span className="mono">{x.s.phone}</span>
                    </span>
                  </div>
                  {x.a != null && x.a < 75 ? <Pill tone="bad">Attendance {A.pctTxt(x.a)}</Pill> : null}
                  {x.v != null && x.v < 50 ? <Pill tone="warn">Avg {A.pctTxt(x.v)}</Pill> : null}
                </div>
              ))
            ) : (
              <Empty>No students below the thresholds.</Empty>
            )}
          </div>
        </section>
      </div>

      <div className="grid3 dash">
        <section className="panel">
          <div className="panel-h">
            <h3>Setup</h3>
            <Pill tone={issues.length ? "warn" : "ok"}>{issues.length} open</Pill>
          </div>
          <div className="ring-wrap" style={{ marginBottom: 12 }}>
            <Ring pct={cls.length ? Math.round((assigned / cls.length) * 100) : null} label="Class teachers assigned" />
            <div>
              <b>
                {assigned} of {cls.length}
              </b>
              <p className="muted">sections have a class teacher</p>
            </div>
          </div>
          <div className="list">
            {issues.length ? (
              issues.slice(0, 4).map(([c, m, v], i) => (
                <div className="row" key={i}>
                  <SubjectCode>{c.length < 6 ? c : initials(c)}</SubjectCode>
                  <div className="grow" style={{ fontSize: ".86rem" }}>
                    {m}
                  </div>
                  <Link className="btn link" href={hrefFor("admin", v)}>
                    Fix
                  </Link>
                </div>
              ))
            ) : (
              <Empty>Everything is set up.</Empty>
            )}
          </div>
          {issues.length > 4 ? (
            <Link className="btn link" href={hrefFor("admin", "classes")} style={{ marginTop: 8, alignSelf: "flex-start" }}>
              See all {issues.length}
            </Link>
          ) : null}
        </section>
        <Panel
          title="Upcoming exams"
          right={
            <Link className="btn link" href={hrefFor("admin", "exams")}>
              Datesheet
            </Link>
          }
        >
          <div className="list">
            {up.length ? (
              up.map((e) => (
                <div className="row" key={e.id}>
                  <SubjectCode>Cl {e.grade}</SubjectCode>
                  <div className="grow">
                    <b>{subj(db, e.subject).name}</b>
                    <span className="muted">{e.name}</span>
                  </div>
                  <div className="r">
                    <div className="mono" style={{ fontSize: ".82rem" }}>
                      {A.fmtDate(e.date)}
                    </div>
                    <span className="muted">in {A.diffDays(e.date, A.today())}d</span>
                  </div>
                </div>
              ))
            ) : (
              <Empty>No exams scheduled.</Empty>
            )}
          </div>
        </Panel>
        <Panel
          title="Latest notices"
          right={
            <Link className="btn link" href={hrefFor("admin", "calendar")}>
              Post
            </Link>
          }
        >
          <NoticeList list={[...db.notices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2)} />
        </Panel>
      </div>
    </>
  );
}
