"use client";

import Link from "next/link";
import { MessageList } from "@/components/MessageList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { PORTAL_LABEL, hrefFor } from "@/components/Sidebar";
import { StatRow } from "@/components/StatRow";
import { useChild } from "@/lib/hooks";
import { attStats, avgPct, cbse, examsFor, rollOf, subFor, subj, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { firstName, fmtDateL, today } from "@/lib/utils";

export default function ParentOverview() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  const t0 = today();
  const msgs = db.messages.filter((m) => m.sid === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const pending = db.homework.filter((h) => h.cls === c.cls && !subFor(db, h.id, c.id));
  const over = pending.filter((h) => h.due && h.due < t0);
  const at = attStats(db, c.id).pct;
  const av = avgPct(db, c.id);
  const next = examsFor(db, c.cls).filter((e) => e.date >= t0).slice(0, 3);

  return (
    <>
      <PageHead eyebrow={PORTAL_LABEL.parent} title={`Welcome, ${c.parent}`} sub={`Here is how ${firstName(c.name)} is doing in Class ${c.cls}.`} />
      <StatRow
        items={[
          { label: "Attendance", value: at ?? "—", unit: "%", caption: at != null && at < 75 ? "Below the 75% minimum" : "School minimum 75%" },
          { label: "Average score", value: av ?? "—", unit: "%", caption: av != null ? "Grade " + cbse(av) : "No results yet" },
          { label: "Homework pending", value: pending.length, caption: `${over.length} overdue` },
          { label: "Messages", value: msgs.length, caption: "from teachers" },
        ]}
      />
      <div className="grid2">
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Panel title="Student">
            <dl className="kv">
              <dt>Name</dt>
              <dd>{c.name}</dd>
              <dt>Class</dt>
              <dd>
                {c.cls} · Roll {rollOf(db, c)}
              </dd>
              <dt>Class teacher</dt>
              <dd>{tName(db, db.classTeacher[c.cls])}</dd>
              <dt>Registered phone</dt>
              <dd className="mono">{c.phone || "—"}</dd>
            </dl>
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
                    <span className="mono" style={{ fontSize: ".85rem" }}>
                      {fmtDateL(e.date)}
                    </span>
                  </div>
                ))
              ) : (
                <Empty>None scheduled. The school publishes datesheets here.</Empty>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
