"use client";

import Link from "next/link";
import { MessageList } from "@/components/MessageList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { PORTAL_LABEL, hrefFor } from "@/components/Sidebar";
import { StudentAnalytics } from "@/components/student-analytics";
import { KpiRow } from "@/components/kpi-row";
import { useChild } from "@/lib/hooks";
import { attendanceKpi, testKpi } from "@/lib/kpis";
import { examsFor, shortNameOf, subFor, subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { firstName, fmtDate, today } from "@/lib/utils";
import * as A from "@/lib/analytics";

export default function ParentOverview() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  const t0 = today();
  const msgs = db.messages.filter((m) => m.sid === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const pending = db.homework.filter((h) => h.cls === c.cls && !subFor(db, h.id, c.id));
  const over = pending.filter((h) => h.due && h.due < t0);
  const next = examsFor(db, c.cls).filter((e) => e.date >= t0).slice(0, 5);

  return (
    <>
      <PageHead eyebrow={PORTAL_LABEL.parent} title={`Welcome, ${c.parent}`} sub={`Here is how ${firstName(c.name)} is doing in Class ${c.cls}.`} />
      <KpiRow
        items={[
          testKpi(db, c),
          attendanceKpi(db, c, true),
          { label: "Homework to do", value: pending.length, caption: `${over.length} overdue` },
          {
            label: "Messages",
            value: msgs.length,
            caption: msgs[0] ? `Latest ${fmtDate(msgs[0].date)} from ${shortNameOf(db, msgs[0].tid)}` : "From teachers",
          },
        ]}
      />
      <StudentAnalytics d={db} sid={c.id} who="parent" />
      <div className="grid2 dash">
        <Panel
          title="Latest from teachers"
          right={
            <Link className="btn link" href={hrefFor("parent", "messages")}>
              All messages
            </Link>
          }
        >
          <MessageList list={msgs.slice(0, 3)} />
        </Panel>
        <Panel title="Next exams">
          <div className="list">
            {next.length ? (
              next.map((e) => (
                <div className="row" key={e.id}>
                  <div className="grow">
                    <b>{subj(db, e.subject).name}</b>
                    <span className="muted">{e.name}</span>
                  </div>
                  <div className="r">
                    <div className="mono" style={{ fontSize: ".85rem" }}>
                      {A.fmtDate(e.date)}
                    </div>
                    <span className="muted">in {A.diffDays(e.date, t0)}d</span>
                  </div>
                </div>
              ))
            ) : (
              <Empty>None scheduled. The school publishes datesheets here.</Empty>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
