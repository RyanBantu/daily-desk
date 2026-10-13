"use client";

import { NoticeList } from "@/components/NoticeList";
import { Panel } from "@/components/Panel";
import { RemarkList } from "@/components/RemarkList";
import { StudentHead } from "@/components/StudentHead";
import { useMe } from "@/lib/hooks";
import { noticesFor } from "@/lib/selectors";
import { useDb } from "@/lib/store";

export default function StudentNotices() {
  const db = useDb();
  const s = useMe();
  if (!s) return null;
  return (
    <>
      <StudentHead title="Remarks & notices" sub="Feedback from your teachers and announcements from school, including inspection visits." />
      <div className="grid2">
        <Panel title="Teacher remarks">
          <RemarkList list={db.remarks.filter((r) => r.sid === s.id).sort((a, b) => b.date.localeCompare(a.date))} />
        </Panel>
        <Panel title="School notices">
          <NoticeList list={noticesFor(db, s.cls)} />
        </Panel>
      </div>
    </>
  );
}
