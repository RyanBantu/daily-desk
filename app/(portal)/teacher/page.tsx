"use client";

import { useRouter } from "next/navigation";
import { ColumnChart, HBars, Legend, LineChart, S1, ScatterChart, type ScatterPoint } from "@/components/charts";
import { DeadlineList } from "@/components/DeadlineList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { KpiRow } from "@/components/kpi-row";
import * as A from "@/lib/analytics";
import { useTeacher, useTeacherCtx } from "@/lib/hooks";
import {
  attByDay,
  attPct,
  cbse,
  classStudents,
  classTeacherOf,
  coverage,
  examsFor,
  handIn,
  pendingSubmissions,
  rounds,
  roundAvg,
  scopeMatch,
  shortRound,
  subFor,
  subj,
} from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { PERIODS, initials, today, weekdayKey } from "@/lib/utils";

export default function TeacherToday() {
  const db = useDb();
  const router = useRouter();
  const setUi = useStore((s) => s.setUi);
  const t = useTeacher();
  const { ctxs, key, cls, sub } = useTeacherCtx();
  if (!t) return null;

  const t0 = today();
  const isSchoolDay = !!weekdayKey(t0);
  const wd = weekdayKey(t0) || "Mon";
  const slots: { cls: string; p: number; sub: string }[] = [];
  Object.entries(db.timetable).forEach(([c, tt]) =>
    PERIODS.forEach((_, i) => {
      const s = tt[`${wd}-${i + 1}`];
      if (s?.teacher === t.id) slots.push({ cls: c, p: i + 1, sub: s.subject });
    }),
  );
  slots.sort((a, b) => a.p - b.p);

  const sids = cls ? classStudents(db, cls).map((s) => s.id) : [];
  const days = cls ? attByDay(db, (c, s) => c === cls && s === sub) : [];
  const att = attPct(days);
  const ctxRounds = cls ? rounds(db, examsFor(db, cls).filter((e) => e.subject === sub)) : [];
  const [latest, prev] = ctxRounds;
  const classAvg = roundAvg(db, latest, sids);
  const hw = handIn(db, db.homework.filter((h) => h.cls === cls && h.subject === sub));
  const toCheck = pendingSubmissions(db, [key]).length;
  const cov = cls ? coverage(db, cls, sub) : { pct: null, current: undefined };
  const ct = classTeacherOf(db, t.id);
  const coming = db.deadlines
    .filter((d) => d.date >= t0 && ctxs.some((k) => scopeMatch(d.scope, k.split("|")[0]) && (!d.subject || d.subject === k.split("|")[1])))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const kids = cls ? A.classStudents(db, cls) : [];
  const ids = kids.map((s) => s.id);
  const g = cls ? A.gradeOf(cls) : 0;
  const rs = cls ? A.rounds(db, g) : [];
  const lr = rs.at(-1);
  const sess = cls ? A.dailyAtt(db, (c, s) => c === cls && s === sub).slice(-12) : [];
  const dist = cls && lr ? A.gradeDist(db, ids, g, lr, sub) : [];
  const dm = Math.max(4, Math.ceil(Math.max(0, ...dist) / 4) * 4);
  const pts = kids
    .map((s) => ({ name: s.name, x: A.attStats(db, s.id, sub ?? undefined).pct, y: A.avgPct(db, s.id, sub ?? undefined) }))
    .filter((p) => p.x != null && p.y != null) as ScatterPoint[];
  const hws = cls ? db.homework.filter((h) => h.cls === cls && h.subject === sub) : [];
  const flags = kids
    .map((s) => {
      const a = A.attStats(db, s.id, sub ?? undefined).pct;
      const v = A.avgPct(db, s.id, sub ?? undefined);
      const overdue = hws.filter((h) => h.due < t0 && !subFor(db, h.id, s.id)).length;
      return { s, a, v, overdue };
    })
    .filter((x) => (x.a != null && x.a < 75) || (x.v != null && x.v < 50) || x.overdue);

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.teacher}
        title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${t.name}`}
        sub={`${t.subjects.map((s) => subj(db, s).name).join(", ") || "No subjects assigned"}${ct.length ? ` · Class teacher of ${ct.join(", ")}` : ""}`}
      />
      {cls && (
        <KpiRow
          items={[
            {
              label: `Attendance · ${cls}`,
              value: att != null ? att.toFixed(1) : "—",
              unit: att != null ? "%" : undefined,
              caption: `${subj(db, sub).name} periods this term`,
              delta: { current: attPct(days.slice(-5)), previous: attPct(days.slice(-10, -5)), label: "vs previous 5" },
            },
            {
              label: "Class average",
              value: classAvg != null ? Math.round(classAvg) : "—",
              unit: classAvg != null ? "%" : undefined,
              caption: latest && classAvg != null ? `${latest.name} · grade ${cbse(classAvg)}` : "No marks yet",
              delta: { current: classAvg, previous: roundAvg(db, prev, sids), label: prev ? `vs ${shortRound(prev.name)}` : undefined },
            },
            {
              label: "Homework handed in",
              value: hw.pct ?? "—",
              unit: hw.pct != null ? "%" : undefined,
              caption: hw.expected ? `${hw.done} of ${hw.expected} · ${toCheck} waiting for you` : "No homework set yet",
            },
            {
              label: "Syllabus covered",
              value: cov.pct ?? "—",
              unit: cov.pct != null ? "%" : undefined,
              caption: cov.current ? `Now: ${cov.current.title}` : "From your course timeline",
            },
          ]}
        />
      )}

      {cls ? (
        <>
          <div className="grid2 dash wide">
            <section className="panel">
              <div className="panel-h">
                <div>
                  <h3>Attendance per period</h3>
                  <p className="muted">
                    {cls} · {subj(db, sub).name} · last {sess.length} school days · average {A.pctTxt(A.aggPct(sess))}
                  </p>
                </div>
                <Legend items={[{ label: "Attendance", color: S1 }, { label: "75% minimum", color: "var(--bad)", dashed: true }]} />
              </div>
              {sess.length ? (
                <LineChart
                  labels={sess.map((x) => A.fmtDate(x.d))}
                  tipLabels={sess.map((x) => `${A.fmtDateLong(x.d)} · ${x.p} of ${x.t} present`)}
                  series={[{ name: "Attendance", color: S1, values: sess.map((x) => x.pct) }]}
                  min={50}
                  max={100}
                  ticks={[50, 60, 70, 80, 90, 100]}
                  unit="%"
                  refLine={{ value: 75, label: "75% minimum" }}
                  fmt={(v) => `${A.r1(v)}%`}
                  height={240}
                  label="Attendance per period"
                />
              ) : (
                <Empty>No registers recorded yet.</Empty>
              )}
            </section>
            <section className="panel">
              <div className="panel-h">
                <div>
                  <h3>Grade distribution</h3>
                  <p className="muted">{lr ? `${lr} · ${subj(db, sub).name} · ${cls}` : "No marks yet"}</p>
                </div>
              </div>
              {lr ? (
                <ColumnChart
                  labels={[...A.BANDS]}
                  series={[{ name: "Papers", color: S1, values: dist }]}
                  max={dm}
                  ticks={[0, dm / 4, dm / 2, (3 * dm) / 4, dm]}
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
                  <h3>Attendance vs. score</h3>
                  <p className="muted">Each dot is a student. Bottom-left needs attention.</p>
                </div>
              </div>
              {pts.length ? (
                <ScatterChart
                  points={pts}
                  xLabel="Attendance in your periods"
                  yLabel="Average score"
                  label="Attendance vs score"
                />
              ) : (
                <Empty>Not enough records to plot students yet.</Empty>
              )}
            </section>
            <div className="col">
              <section className="panel">
                <div className="panel-h">
                  <div>
                    <h3>Homework completion</h3>
                    <p className="muted">{cls} · {subj(db, sub).name}</p>
                  </div>
                </div>
                {hws.length ? (
                  <HBars
                    rows={[...hws]
                      .sort((a, b) => a.due.localeCompare(b.due))
                      .map((h) => {
                        const n = db.submissions.filter((x) => x.hw === h.id).length;
                        const pct = kids.length ? Math.round((n / kids.length) * 100) : null;
                        const past = h.due < t0;
                        return {
                          label: h.title,
                          value: pct,
                          display: `${n}/${kids.length}`,
                          tone: past && (pct ?? 0) < 75 ? ("bad" as const) : undefined,
                          tip: `${h.title}\n${n} of ${kids.length} submitted${past ? " · past due" : ""}`,
                        };
                      })}
                  />
                ) : (
                  <Empty>No homework set yet.</Empty>
                )}
              </section>
              <section className="panel grow-p">
                <div className="panel-h">
                  <h3>Students needing attention</h3>
                  <Pill tone={flags.length ? "bad" : "ok"}>{flags.length}</Pill>
                </div>
                <div className="list">
                  {flags.length ? (
                    flags.map((x) => (
                      <div className="row" key={x.s.id}>
                        <div className="avatar">{initials(x.s.name)}</div>
                        <div className="grow">
                          <b>{x.s.name}</b>
                          <span className="muted">{x.s.cls}</span>
                        </div>
                        {x.a != null && x.a < 75 ? <Pill tone="bad">Attendance {A.pctTxt(x.a)}</Pill> : null}
                        {x.v != null && x.v < 50 ? <Pill tone="warn">Avg {A.pctTxt(x.v)}</Pill> : null}
                        {x.overdue ? <Pill tone="warn">{x.overdue} overdue homework</Pill> : null}
                      </div>
                    ))
                  ) : (
                    <Empty>No students below the thresholds.</Empty>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}

      <div className="grid2 dash">
        <Panel title="Today's periods">
          <div className="list">
            {slots.length ? (
              slots.map((s) => {
                const done = !!db.attendance[`${s.cls}|${s.sub}|${t0}`];
                return (
                  <div className="row" key={s.cls + s.p}>
                    <span className="mono" style={{ fontSize: ".8rem", color: "var(--muted)", width: 92 }}>
                      P{s.p} · {PERIODS[s.p - 1][0]}
                    </span>
                    <div className="grow">
                      <b>
                        {s.cls} · {subj(db, s.sub).name}
                      </b>
                    </div>
                    {isSchoolDay ? (
                      done ? (
                        <Pill tone="ok">Attendance taken</Pill>
                      ) : (
                        <button
                          type="button"
                          className="btn primary sm"
                          onClick={() => {
                            setUi({ tctx: `${s.cls}|${s.sub}` });
                            router.push("/teacher/attendance");
                          }}
                        >
                          Take attendance
                        </button>
                      )
                    ) : null}
                  </div>
                );
              })
            ) : (
              <Empty>No periods today. Your timetable is set by the school office.</Empty>
            )}
          </div>
        </Panel>
        <Panel title="Coming up">
          <DeadlineList list={coming} emptyMsg="No deadlines coming up for your classes." />
        </Panel>
      </div>
    </>
  );
}
