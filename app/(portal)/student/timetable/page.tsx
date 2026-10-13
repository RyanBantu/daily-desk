"use client";

import { Panel } from "@/components/Panel";
import { StudentHead } from "@/components/StudentHead";
import { EmptySlot, Slot, TimetableGrid } from "@/components/TimetableGrid";
import { useMe } from "@/lib/hooks";
import { shortNameOf, subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";

export default function StudentTimetable() {
  const db = useDb();
  const s = useMe();
  const tt = (s && db.timetable[s.cls]) || {};
  return (
    <>
      <StudentHead title="Weekly timetable" />
      <Panel>
        <TimetableGrid
          markToday
          cell={(d, p, isToday) => {
            const x = tt[`${d}-${p}`];
            return x ? <Slot title={subj(db, x.subject).name} sub={shortNameOf(db, x.teacher)} today={isToday} /> : <EmptySlot label="—" />;
          }}
        />
      </Panel>
    </>
  );
}
