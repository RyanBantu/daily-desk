"use client";

import { CourseTimeline } from "@/components/CourseTimeline";
import { DeadlineList } from "@/components/DeadlineList";
import { Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { StudentHead } from "@/components/StudentHead";
import { useMe } from "@/lib/hooks";
import { classSubjects, deadlinesFor, subj, subjTeacher, tName } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { fmtDate, today } from "@/lib/utils";

export default function StudentPlan() {
  const db = useDb();
  const s = useMe();
  if (!s) return null;
  const t0 = today();
  return (
    <>
      <StudentHead title="Course timeline" sub="What each subject is covering this term, and what is due." />
      {classSubjects(db, s.cls).map((sub) => {
        const units = db.plan.filter((x) => x.cls === s.cls && x.subject === sub);
        const dl = db.deadlines.filter((d) => d.scope === s.cls && d.subject === sub);
        return (
          <Panel key={sub} title={subj(db, sub).name} right={<span className="muted">{tName(db, subjTeacher(db, s.cls, sub))}</span>}>
            <CourseTimeline units={units} emptyMsg="Your teacher has not published a plan yet." />
            {dl.length ? (
              <div className="actions" style={{ marginTop: 12 }}>
                {dl.map((d) => (
                  <Pill key={d.id} tone="warn">
                    Due {fmtDate(d.date)}: {d.title}
                  </Pill>
                ))}
              </div>
            ) : null}
          </Panel>
        );
      })}
      <Panel title="School deadlines">
        <DeadlineList list={deadlinesFor(db, s.cls).filter((d) => !d.subject && d.date >= t0)} emptyMsg="No school deadlines coming up." />
      </Panel>
    </>
  );
}
