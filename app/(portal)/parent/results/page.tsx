"use client";

import { Panel } from "@/components/Panel";
import { RemarkList } from "@/components/RemarkList";
import { ResultsTable } from "@/components/ResultsTable";
import { ParentHead } from "@/components/StudentHead";
import { useChild } from "@/lib/hooks";
import { useDb } from "@/lib/store";

export default function ParentResults() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  return (
    <>
      <ParentHead title="Results & remarks" />
      <Panel title="Exam results" right={<span className="muted">CBSE grading scale</span>}>
        <ResultsTable sid={c.id} />
      </Panel>
      <Panel title="Remarks shared with you">
        <RemarkList
          list={db.remarks.filter((r) => r.sid === c.id && r.shared).sort((a, b) => b.date.localeCompare(a.date))}
          emptyMsg="No remarks yet. Remarks appear here when a teacher chooses to share them with you."
        />
      </Panel>
    </>
  );
}
