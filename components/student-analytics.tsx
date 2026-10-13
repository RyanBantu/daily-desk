"use client";

import { AttendanceStrip, ColumnChart, HBars, Legend, LineChart, Ring, S1, S2 } from "@/components/charts";
import { Empty } from "@/components/Panel";
import * as A from "@/lib/analytics";
import type { DB } from "@/lib/types";

export function StudentAnalytics({ d, sid, who }: { d: DB; sid: string; who: "self" | "parent" }) {
  const s = d.students.find((x) => x.id === sid)!;
  const g = A.gradeOf(s.cls),
    rs = A.rounds(d, g),
    lr = rs.at(-1);
  const peers = A.classStudents(d, s.cls).map((x) => x.id),
    subs = A.classSubjects(d, s.cls);
  const meName = who === "self" ? "You" : s.name.split(" ")[0];
  const mine = subs.map((x) => (lr ? A.roundPct(d, [sid], g, lr, x) : null));
  const cls = subs.map((x) => (lr ? A.roundPct(d, peers, g, lr, x) : null));
  const best = subs.map((x, i) => [x, mine[i]] as const).filter((x) => x[1] != null).sort((a, b) => b[1]! - a[1]!);
  const hw = A.hwCounts(d, s.cls, undefined, [sid]);
  const cov = subs.filter((x) => A.coverage(d, s.cls, x) != null);

  return (
    <>
      <div className="grid2 dash">
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Scores by subject</h3>
              <p className="muted">
                {lr ?? "No exams yet"} · {who === "self" ? "Your" : `${meName}'s`} compared with the class average
              </p>
            </div>
            <Legend items={[{ label: meName, color: S1 }, { label: "Class average", color: S2 }]} />
          </div>
          {lr ? (
            <ColumnChart
              labels={subs.map((x) => A.subjectOf(d, x).code)}
              tipLabels={subs.map((x) => A.subjectOf(d, x).name)}
              series={[
                { name: meName, color: S1, values: mine },
                { name: "Class average", color: S2, values: cls },
              ]}
              max={100}
              ticks={[0, 25, 50, 75, 100]}
              unit="%"
              fmt={(v) => A.pctTxt(v)}
              label="Scores by subject"
            />
          ) : (
            <Empty>No marks yet.</Empty>
          )}
          {best.length > 1 && (
            <p className="muted" style={{ marginTop: 6 }}>
              Strongest:{" "}
              <b>
                {A.subjectOf(d, best[0][0]).name} ({A.pctTxt(best[0][1])})
              </b>{" "}
              · Focus area:{" "}
              <b>
                {A.subjectOf(d, best.at(-1)![0]).name} ({A.pctTxt(best.at(-1)![1])})
              </b>
            </p>
          )}
        </section>
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Progress across tests</h3>
              <p className="muted">Average of all subjects in each test</p>
            </div>
            <Legend items={[{ label: meName, color: S1 }, { label: "Class average", color: S2, dashed: true }]} />
          </div>
          {rs.length ? (
            <LineChart
              labels={rs.map(A.shortRound)}
              tipLabels={rs}
              series={[
                { name: meName, color: S1, values: rs.map((r) => A.roundPct(d, [sid], g, r)) },
                { name: "Class average", color: S2, values: rs.map((r) => A.roundPct(d, peers, g, r)), dashed: true },
              ]}
              min={0}
              max={100}
              ticks={[0, 25, 50, 75, 100]}
              unit="%"
              fmt={(v) => A.pctTxt(v)}
              label="Progress across tests"
            />
          ) : (
            <Empty>No tests yet.</Empty>
          )}
        </section>
      </div>

      <div className="grid3 dash">
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Attendance by subject</h3>
              <p className="muted">Line marks the 75% minimum</p>
            </div>
          </div>
          <HBars
            refPct={75}
            rows={subs.map((x) => {
              const a = A.attStats(d, sid, x);
              return {
                label: A.subjectOf(d, x).name,
                value: a.pct,
                display: A.pctTxt(a.pct),
                tone: a.pct == null ? undefined : a.pct < 75 ? "bad" : a.pct < 85 ? "warn" : undefined,
                tip: `${A.subjectOf(d, x).name}\nPresent ${a.p} · Late ${a.l} · Absent ${a.a}`,
              };
            })}
          />
        </section>
        <div className="col">
          <section className="panel">
            <div className="panel-h">
              <div>
                <h3>Recent school days</h3>
                <p className="muted">One square per day</p>
              </div>
            </div>
            <AttendanceStrip days={A.studentDays(d, sid)} />
          </section>
          <section className="panel grow-p">
            <div className="panel-h">
              <h3>Homework</h3>
            </div>
            <div className="ring-wrap">
              <Ring pct={hw.pct} label="Homework submitted" />
              <div>
                <b>
                  {hw.done} of {hw.expected} submitted
                </b>
                <p className="muted">Homework handed in this term</p>
              </div>
            </div>
          </section>
        </div>
        <section className="panel">
          <div className="panel-h">
            <div>
              <h3>Syllabus covered</h3>
              <p className="muted">Share of planned units taught so far in each subject</p>
            </div>
          </div>
          {cov.length ? (
            <HBars
              rows={cov.map((x) => ({
                label: A.subjectOf(d, x).name,
                value: A.coverage(d, s.cls, x),
                display: A.pctTxt(A.coverage(d, s.cls, x)),
                tip: `${A.subjectOf(d, x).name}\n${A.pctTxt(A.coverage(d, s.cls, x))} of planned units covered`,
              }))}
            />
          ) : (
            <Empty>Teachers have not published course timelines yet.</Empty>
          )}
        </section>
      </div>
    </>
  );
}
