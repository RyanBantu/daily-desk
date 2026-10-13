"use client";

import Link from "next/link";
import { NoticeList } from "@/components/NoticeList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { hrefFor } from "@/components/Sidebar";
import { StatRow } from "@/components/StatRow";
import { useMe } from "@/lib/hooks";
import { attStats, avgPct, cbse, dueState, examsFor, noticesFor, rollOf, shortNameOf, subFor, subj, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { PERIODS, firstName, fmtDate, today, weekdayKey } from "@/lib/utils";

export default function StudentOverview() {
  const db = useDb();
  const s = useMe();
  if (!s) return null;
  const t0 = today();
  const wd = weekdayKey(t0);
  const tt = db.timetable[s.cls] || {};
  const hw = db.homework.filter((h) => h.cls === s.cls && !subFor(db, h.id, s.id)).sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));
  const ex = examsFor(db, s.cls).filter((e) => e.date >= t0).slice(0, 4);
  const av = avgPct(db, s.id);
  const at = attStats(db, s.id).pct;
  const periods = PERIODS.map((p, i) => ({ p, x: tt[`${wd || "Mon"}-${i + 1}`] })).filter((r) => r.x);

  return (
    <>
      <PageHead eyebrow={`Class ${s.cls} · Roll ${rollOf(db, s)}`} title={`Hi ${firstName(s.name)}`} sub={`Class teacher: ${tName(db, db.classTeacher[s.cls])}`} />
      <StatRow
        items={[
          { label: "Homework to do", value: hw.length, caption: `${hw.filter((h) => h.due && h.due < t0).length} overdue` },
          { label: "Attendance", value: at ?? "—", unit: "%", caption: "Minimum 75%" },
          { label: "Average score", value: av ?? "—", unit: "%", caption: av != null ? "Grade " + cbse(av) : "No results yet" },
          {
            label: "Next exam",
            value: ex[0] ? fmtDate(ex[0].date) : "—",
            valueStyle: { fontSize: "1.2rem", paddingTop: 6 },
            caption: ex[0] ? subj(db, ex[0].subject).name : "None scheduled",
          },
        ]}
      />
      <div className="grid3">
        <Panel title={wd ? "Today" : "Monday"}>
          <div className="list">
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
