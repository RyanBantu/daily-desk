"use client";

import { subj, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import type { Deadline } from "@/lib/types";
import { diffDays, fmtDate, today } from "@/lib/utils";
import { Empty } from "./Panel";
import { Pill } from "./Pill";

export function DeadlineList({ list, emptyMsg = "No deadlines coming up." }: { list: Deadline[]; emptyMsg?: string }) {
  const db = useDb();
  if (!list.length) return <Empty>{emptyMsg}</Empty>;
  return (
    <div className="list">
      {list.map((d) => {
        const n = diffDays(d.date, today());
        return (
          <div className="row" key={d.id}>
            <div className="grow">
              <b>{d.title}</b>
              <span className="muted">
                {d.subject ? subj(db, d.subject).name + " · " : ""}
                {d.by === "admin" ? "School office" : tName(db, d.by)}
              </span>
            </div>
            <div className="r">
              <div className="mono" style={{ fontSize: ".85rem" }}>
                {fmtDate(d.date)}
              </div>
              <Pill tone={n < 0 ? "mute" : n <= 3 ? "warn" : "info"}>{n < 0 ? "Passed" : n === 0 ? "Today" : `In ${n}d`}</Pill>
            </div>
          </div>
        );
      })}
    </div>
  );
}
