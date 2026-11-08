"use client";

import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { ParentHead } from "@/components/StudentHead";
import { SubjectCode } from "@/components/SubjectCode";
import { useChild } from "@/lib/hooks";
import { dueState, subFor, subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { firstName, fmtDateL } from "@/lib/utils";

export default function ParentHomework() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  const list = db.homework.filter((h) => h.cls === c.cls).sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));

  return (
    <>
      <ParentHead
        title="Assignments"
        sub={`${firstName(c.name)}'s homework for Class ${c.cls}. You can see due dates and teacher remarks; only ${firstName(c.name)} can upload work.`}
      />
      <Panel>
        <div className="list">
          {list.length ? (
            list.map((h) => {
              const [l, tone] = dueState(db, h, c.id);
              const sb = subFor(db, h.id, c.id);
              return (
                <div className="row" style={{ alignItems: "flex-start" }} key={h.id}>
                  <div className="grow">
                    <div className="actions" style={{ gap: 8, marginBottom: 4 }}>
                      <SubjectCode>{subj(db, h.subject).code}</SubjectCode>
                      <span className="muted">Due {fmtDateL(h.due)}</span>
                    </div>
                    <b>{h.title}</b>
                    <p style={{ color: "var(--ink-2)", marginTop: 2 }}>{h.instructions}</p>
                    {sb?.status === "reviewed" ? (
                      <div className="quote" style={{ marginTop: 8 }}>
                        <b>{sb.score != null ? sb.score + " / 10 · " : ""}</b>
                        {sb.shared ? sb.remark || "Checked" : "Teacher has reviewed this. Remarks appear here when they are shared with you."}
                      </div>
                    ) : sb ? (
                      <p className="muted" style={{ marginTop: 6 }}>
                        Submitted {fmtDateL(sb.time.slice(0, 10))}
                      </p>
                    ) : null}
                  </div>
                  <Pill tone={tone}>{l}</Pill>
                </div>
              );
            })
          ) : (
            <Empty>No assignments for this class yet.</Empty>
          )}
        </div>
      </Panel>
    </>
  );
}
