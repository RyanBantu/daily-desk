"use client";

import { ExamSchedule } from "@/components/ExamSchedule";
import { Panel } from "@/components/Panel";
import { ResultsTable } from "@/components/ResultsTable";
import { StudentHead } from "@/components/StudentHead";
import { useMe } from "@/lib/hooks";

export default function StudentExams() {
  const s = useMe();
  if (!s) return null;
  return (
    <>
      <StudentHead title="Marks & feedback" sub="Your datesheet and every published score. Other students’ marks are not shown." />
      <Panel title="Upcoming exams">
        <ExamSchedule cls={s.cls} />
      </Panel>
      <Panel title="Results" right={<span className="muted">CBSE grading scale</span>}>
        <ResultsTable sid={s.id} />
      </Panel>
    </>
  );
}
