"use client";

import { levelTone, subj, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import type { Remark } from "@/lib/types";
import { fmtDate, initials } from "@/lib/utils";
import { Empty } from "./Panel";
import { Pill } from "./Pill";

export function RemarkList({
  list,
  onShare,
  emptyMsg = "No remarks yet. Subject teachers write them from the Teacher portal.",
}: {
  list: Remark[];
  /** shows "Send to parent" for remarks not yet shared */
  onShare?: (id: string) => void;
  emptyMsg?: string;
}) {
  const db = useDb();
  if (!list.length) return <Empty>{emptyMsg}</Empty>;
  return (
    <div className="list">
      {list.map((r) => (
        <div className="row" style={{ alignItems: "flex-start" }} key={r.id}>
          <div className="avatar">{initials(tName(db, r.tid))}</div>
          <div className="grow">
            <div className="actions" style={{ gap: 8, marginBottom: 4 }}>
              <Pill tone={levelTone(r.level)}>{r.level}</Pill>
              <span className="muted">
                {subj(db, r.subject).name} · {tName(db, r.tid)} · {fmtDate(r.date)}
              </span>
            </div>
            <p style={{ color: "var(--ink-2)" }}>{r.text}</p>
          </div>
          {onShare ? (
            r.shared ? (
              <Pill tone="ok">Sent to parent</Pill>
            ) : (
              <button type="button" className="btn ghost sm" onClick={() => onShare(r.id)}>
                Send to parent
              </button>
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}
