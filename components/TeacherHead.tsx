"use client";

import type { ReactNode } from "react";
import { useTeacherCtx } from "@/lib/hooks";
import { subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { PageHead } from "./PageHead";
import { Empty } from "./Panel";
import { PORTAL_LABEL } from "./Sidebar";

/** Page head whose eyebrow is the class·subject picked in the header, e.g. "Class 10-A · Computer Science". */
export function TeacherHead({ title, sub }: { title: string; sub?: ReactNode }) {
  const db = useDb();
  const { cls, sub: s } = useTeacherCtx();
  return <PageHead eyebrow={cls ? `Class ${cls} · ${subj(db, s).name}` : PORTAL_LABEL.teacher} title={title} sub={sub} />;
}

export function NoClasses() {
  return <Empty>You have no periods on the timetable yet. The school office assigns classes from the Admin portal.</Empty>;
}
