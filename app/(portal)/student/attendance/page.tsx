"use client";

import { AttendanceSummary } from "@/components/AttendanceSummary";
import { StudentHead } from "@/components/StudentHead";
import { useMe } from "@/lib/hooks";

export default function StudentAttendance() {
  const s = useMe();
  return (
    <>
      <StudentHead title="Attendance" />
      {s ? <AttendanceSummary sid={s.id} /> : null}
    </>
  );
}
