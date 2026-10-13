"use client";

import { PageHead } from "@/components/PageHead";
import { Panel } from "@/components/Panel";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { EmptySlot, Slot, TimetableGrid } from "@/components/TimetableGrid";
import { useTeacher } from "@/lib/hooks";
import { periodsPerWeek, subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";

export default function TeacherTimetable() {
  const db = useDb();
  const t = useTeacher();
  return (
    <>
      <PageHead eyebrow={PORTAL_LABEL.teacher} title="My timetable" sub={`${periodsPerWeek(db, t?.id)} periods a week. Set by the school office.`} />
      <Panel>
        <TimetableGrid
          markToday
          cell={(d, p, isToday) => {
            const hit = Object.entries(db.timetable).find(([, tt]) => tt[`${d}-${p}`]?.teacher === t?.id);
            if (!hit) return <EmptySlot label="Free" />;
            const [cls, tt] = hit;
            return <Slot title={cls} sub={subj(db, tt[`${d}-${p}`].subject).name} today={isToday} />;
          }}
        />
      </Panel>
    </>
  );
}
