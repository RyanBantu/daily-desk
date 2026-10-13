"use client";

import { catTone, scopeLabel } from "@/lib/selectors";
import type { Notice } from "@/lib/types";
import { fmtDateL } from "@/lib/utils";
import { ConfirmButton } from "./ConfirmButton";
import { Empty } from "./Panel";
import { Pill } from "./Pill";

export function NoticeList({
  list,
  onRemove,
  emptyMsg = "No notices yet. The school office posts them from the Admin portal.",
}: {
  list: Notice[];
  onRemove?: (id: string) => void;
  emptyMsg?: string;
}) {
  if (!list.length) return <Empty>{emptyMsg}</Empty>;
  return (
    <div className="list">
      {list.map((n) => (
        <div className="row" style={{ alignItems: "flex-start" }} key={n.id}>
          <div className="grow">
            <div className="actions" style={{ gap: 8, marginBottom: 4 }}>
              <Pill tone={catTone(n.category)}>{n.category}</Pill>
              <span className="muted">
                {fmtDateL(n.date)} · {scopeLabel(n.scope)}
              </span>
            </div>
            <b>{n.title}</b>
            <p className="muted" style={{ marginTop: 3, fontSize: ".88rem", color: "var(--ink-2)" }}>
              {n.body}
            </p>
          </div>
          {onRemove ? <ConfirmButton onConfirm={() => onRemove(n.id)}>Remove</ConfirmButton> : null}
        </div>
      ))}
    </div>
  );
}
