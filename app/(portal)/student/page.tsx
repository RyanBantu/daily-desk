"use client";

import Link from "next/link";
import { NoticeList } from "@/components/NoticeList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { hrefFor } from "@/components/Sidebar";
import { StudentAnalytics } from "@/components/student-analytics";
import { KpiRow } from "@/components/kpi-row";
import { useMe } from "@/lib/hooks";
import { attendanceKpi, testKpi } from "@/lib/kpis";
import { daysUntil, dueState, examsFor, noticesFor, rollOf, shortNameOf, subFor, subj, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { PERIODS, firstName, fmtDate, today, weekdayKey } from "@/lib/utils";
import * as A from "@/lib/analytics";

export default function StudentOverview() {
  const db = useDb();
  const s = useMe();
  if (!s) return null;
  const t0 = today();
  const wd = weekdayKey(t0);
  const tt = db.timetable[s.cls] || {};
  const hw = db.homework.filter((h) => h.cls === s.cls && !subFor(db, h.id, s.id)).sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));
  const ex = examsFor(db, s.cls).filter((e) => e.date >= t0).slice(0, 3);
  const periods = PERIODS.map((p, i) => ({ p, x: tt[`${wd || "Mon"}-${i + 1}`] })).filter((r) => r.x);

  return (
    <>
      <PageHead eyebrow={`Class ${s.cls} · Roll ${rollOf(db, s)}`} title={`Hi ${firstName(s.name)}`} sub={`Class teacher: ${tName(db, db.classTeacher[s.cls])}`} />
      <KpiRow
        items={[
          testKpi(db, s),
          attendanceKpi(db, s, false),
          { label: "Homework to do", value: hw.length, caption: `${hw.filter((h) => h.due && h.due < t0).length} overdue` },
          {
            label: "Next exam",
            value: ex[0] ? fmtDate(ex[0].date) : "—",
            caption: ex[0] ? `${subj(db, ex[0].subject).name} · ${daysUntil(ex[0].date)}` : "None scheduled",
          },
        ]}
      />
      <StudentAnalytics d={db} sid={s.id} who="self" />
      <div className="grid3 dash">
        <Panel title={wd ? "Today" : "Monday"}>
          <div className="list tight">
            {periods.length ? (
              periods.map(({ p, x }) => (
                <div className="row" key={p[0]}>
                  <span className="mono muted" style={{ fontSize: ".78rem", width: 44 }}>
                    {p[0]}
                  </span>
                  <div className="grow">
                    <b>{subj(db, x!.subject).name}</b>
                    <span className="muted">{shortNameOf(db, x!.teacher)}</span>
                  </div>
                </div>
              ))
            ) : (
              <Empty>No timetable yet. The school office sets it from the Admin portal.</Empty>
            )}
          </div>
        </Panel>
        <div className="col">
          <Panel
            title="Homework due"
            right={
              <Link className="btn link" href={hrefFor("student", "homework")}>
                All
              </Link>
            }
          >
            <div className="list">
              {hw.length ? (
                hw.slice(0, 5).map((h) => {
                  const [l, c] = dueState(db, h, s.id);
                  return (
                    <div className="row" key={h.id}>
                      <div className="grow">
                        <b>{h.title}</b>
                        <span className="muted">{subj(db, h.subject).name}</span>
                      </div>
                      <Pill tone={c}>{l}</Pill>
                    </div>
                  );
                })
              ) : (
                <Empty>You are all caught up.</Empty>
              )}
            </div>
          </Panel>
          <Panel title="Upcoming exams" className="grow-p">
            <div className="list">
              {ex.length ? (
                ex.map((e) => (
                  <div className="row" key={e.id}>
                    <div className="grow">
                      <b>{subj(db, e.subject).name}</b>
                      <span className="muted">{e.name}</span>
                    </div>
                    <div className="r">
                      <div className="mono" style={{ fontSize: ".82rem" }}>
                        {A.fmtDate(e.date)}
                      </div>
                      <span className="muted">in {A.diffDays(e.date, t0)}d</span>
                    </div>
                  </div>
                ))
              ) : (
                <Empty>None scheduled.</Empty>
              )}
            </div>
          </Panel>
        </div>
        <Panel
          title="Notices"
          right={
            <Link className="btn link" href={hrefFor("student", "notices")}>
              All
            </Link>
          }
        >
          <NoticeList list={noticesFor(db, s.cls).slice(0, 2)} />
        </Panel>
      </div>
    </>
  );
}
