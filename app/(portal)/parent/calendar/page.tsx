"use client";

import { DeadlineList } from "@/components/DeadlineList";
import { ExamSchedule } from "@/components/ExamSchedule";
import { Panel } from "@/components/Panel";
import { ParentHead } from "@/components/StudentHead";
import { useChild } from "@/lib/hooks";
import { deadlinesFor } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { today } from "@/lib/utils";

export default function ParentCalendar() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  const t0 = today();
  return (
    <>
      <ParentHead title="Exams & deadlines" />
      <Panel title="Exam datesheet">
        <ExamSchedule cls={c.cls} />
      </Panel>
      <Panel title="Deadlines">
        <DeadlineList list={deadlinesFor(db, c.cls).filter((d) => d.date >= t0)} />
      </Panel>
    </>
  );
}
