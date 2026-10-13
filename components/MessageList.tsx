"use client";

import { subj, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import type { Message } from "@/lib/types";
import { fmtDate, initials } from "@/lib/utils";
import { Empty } from "./Panel";
import { Pill } from "./Pill";

export function MessageList({ list }: { list: Message[] }) {
  const db = useDb();
  if (!list.length)
    return <Empty>No messages yet. Scores, homework feedback and remarks appear here when a teacher sends them to you.</Empty>;
  return (
    <div>
      {list.map((m) => (
        <div className="msg" key={m.id}>
          <div className="avatar">{initials(tName(db, m.tid))}</div>
          <div style={{ minWidth: 0 }}>
            <div className="actions" style={{ gap: 8, marginBottom: 3 }}>
              <Pill tone={m.kind === "Remark" ? "info" : m.kind === "Exam score" ? "ok" : "warn"}>{m.kind}</Pill>
              <span className="muted">
                {tName(db, m.tid)} · {subj(db, m.subject).name} · {fmtDate(m.date)}
              </span>
            </div>
            <b>{m.title}</b>
            <p style={{ color: "var(--ink-2)", marginTop: 2 }}>{m.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
