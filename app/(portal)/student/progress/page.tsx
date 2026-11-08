"use client";

import { StudentHead } from "@/components/StudentHead";
import { StudentAnalytics } from "@/components/student-analytics";
import { useMe } from "@/lib/hooks";
import { useDb } from "@/lib/store";

export default function StudentProgress() {
  const db = useDb();
  const s = useMe();
  if (!s) return null;
  return (
    <>
      <StudentHead title="My progress" sub="Your scores, attendance and homework over time. Classmates’ names and marks are not shown." />
      <StudentAnalytics d={db} sid={s.id} who="self" />
    </>
  );
}
