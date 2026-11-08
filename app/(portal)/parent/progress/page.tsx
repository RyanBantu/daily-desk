"use client";

import { ParentHead } from "@/components/StudentHead";
import { StudentAnalytics } from "@/components/student-analytics";
import { useChild } from "@/lib/hooks";
import { useDb } from "@/lib/store";
import { firstName } from "@/lib/utils";

export default function ParentProgress() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  return (
    <>
      <ParentHead title="Progress" sub={`Scores, attendance and homework for ${firstName(c.name)} only — not classmates.`} />
      <StudentAnalytics d={db} sid={c.id} who="parent" />
    </>
  );
}
