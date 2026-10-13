"use client";

import { examsFor, subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { diffDays, fmtDateL, fmtTime, today } from "@/lib/utils";
import { Empty } from "./Panel";

export function ExamSchedule({ cls }: { cls: string }) {
  const db = useDb();
  const t = today();
  const list = examsFor(db, cls).filter((e) => e.date >= t);
  if (!list.length) return <Empty>No upcoming exams scheduled. The school office publishes datesheets from the Admin portal.</Empty>;
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Exam</th>
            <th>Subject</th>
            <th className="r">Max</th>
            <th className="r">In</th>
          </tr>
        </thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.id}>
              <td>{fmtDateL(e.date)}</td>
              <td className="mono">{fmtTime(e.time)}</td>
              <td>{e.name}</td>
              <td>{subj(db, e.subject).name}</td>
              <td className="num">{e.max}</td>
              <td className="num">{diffDays(e.date, t)}d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
