import type { ReactNode } from "react";
import type { PillTone } from "@/lib/types";

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`pill p-${tone}`}>{children}</span>;
}

/** Attendance percentage, red below the 75% minimum. */
export function PctPill({ pct }: { pct: number | null }) {
  return pct == null ? <span className="muted">—</span> : <Pill tone={pct < 75 ? "bad" : "ok"}>{pct}%</Pill>;
}
