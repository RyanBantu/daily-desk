"use client";

import { AttendanceSummary } from "@/components/AttendanceSummary";
import { ParentHead } from "@/components/StudentHead";
import { useChild } from "@/lib/hooks";

export default function ParentAttendance() {
  const c = useChild();
  return (
    <>
      <ParentHead title="Attendance" />
      {c ? <AttendanceSummary sid={c.id} /> : null}
    </>
  );
}
