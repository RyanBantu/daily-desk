"use client";

import { useState } from "react";
import { MaterialCard } from "@/components/MaterialCard";
import { Empty, Panel } from "@/components/Panel";
import { StudentHead } from "@/components/StudentHead";
import { useMe } from "@/lib/hooks";
import { classSubjects, subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";

export default function StudentMaterials() {
  const db = useDb();
  const s = useMe();
  const [filter, setFilter] = useState("all");
  if (!s) return null;
  const subs = classSubjects(db, s.cls);
  const list = db.materials
    .filter((m) => m.cls === s.cls && (filter === "all" || m.subject === filter))
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <StudentHead title="Course material" sub="Notes and files your teachers have posted." />
      <div className="chips">
        <button type="button" className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          All subjects
        </button>
        {subs.map((x) => (
          <button key={x} type="button" className="chip" aria-pressed={filter === x} onClick={() => setFilter(x)}>
            {subj(db, x).name}
          </button>
        ))}
      </div>
      <Panel>
        {list.length ? list.map((m) => <MaterialCard key={m.id} m={m} />) : <Empty>No material posted yet. Your subject teachers upload notes and worksheets here.</Empty>}
      </Panel>
    </>
  );
}
