"use client";

import type { ReactNode } from "react";
import { useChild, useMe } from "@/lib/hooks";
import { PageHead } from "./PageHead";

/** Eyebrow "Amn Shetty · Class 10-A". */
export function StudentHead({ title, sub }: { title: string; sub?: ReactNode }) {
  const s = useMe();
  return <PageHead eyebrow={s ? `${s.name} · Class ${s.cls}` : "Student portal"} title={title} sub={sub} />;
}

/** Eyebrow "Parent of Pete Mathew · Class 10-A". */
export function ParentHead({ title, sub }: { title: string; sub?: ReactNode }) {
  const c = useChild();
  return <PageHead eyebrow={c ? `Parent of ${c.name} · Class ${c.cls}` : "Parent portal"} title={title} sub={sub} />;
}
