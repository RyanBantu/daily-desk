"use client";

import Link from "next/link";
import { NoticeList } from "@/components/NoticeList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { PORTAL_LABEL, hrefFor } from "@/components/Sidebar";
import { StatRow } from "@/components/StatRow";
import { SubjectCode } from "@/components/SubjectCode";
import { allClasses, classStudents, shortNameOf, subj, teacher } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { GRADES, fmtDateL, initials, today } from "@/lib/utils";

export default function AdminOverview() {
  const db = useDb();
  const cls = allClasses(db);
  const assigned = cls.filter((c) => db.classTeacher[c] && teacher(db, db.classTeacher[c])).length;
  const issues: [string, string, string][] = [];
  cls.forEach((c) => {
    if (!db.classTeacher[c]) issues.push([c, "No class teacher assigned", "classes"]);
    else if (!classStudents(db, c).length) issues.push([c, `${shortNameOf(db, db.classTeacher[c])} has not added students yet`, "classes"]);
    if (!Object.keys(db.timetable[c] || {}).length) issues.push([c, "Timetable is empty", "timetable"]);
  });
  db.teachers.filter((t) => !t.subjects.length).forEach((t) => issues.push([t.name, "No subjects assigned", "teachers"]));
  const up = db.exams
    .filter((e) => e.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title={db.school.name}
        sub={`Academic year ${db.school.year} · Classes ${GRADES[0]}–${GRADES[GRADES.length - 1]}`}
      />
      <StatRow
        items={[
          { label: "Sections", value: cls.length, caption: `across ${GRADES.length} classes` },
          { label: "Teachers", value: db.teachers.length, caption: `${db.subjects.length} subjects` },
          { label: "Students", value: db.students.length, caption: "added by class teachers" },
          { label: "Class teachers", value: assigned, unit: ` / ${cls.length}`, caption: "sections covered" },
        ]}
      />
      <div className="grid2">
        <Panel title="Needs attention" right={<Pill tone={issues.length ? "warn" : "ok"}>{issues.length} open</Pill>}>
          <div className="list" style={{ maxHeight: 360, overflow: "auto" }}>
            {issues.length ? (
              issues.slice(0, 40).map(([c, m, v], i) => (
                <div className="row" key={i}>
                  <SubjectCode>{c.length < 6 ? c : initials(c)}</SubjectCode>
                  <div className="grow">{m}</div>
                  <Link className="btn link" href={hrefFor("admin", v)}>
                    Fix
                  </Link>
                </div>
              ))
            ) : (
              <Empty>Everything is set up.</Empty>
            )}
          </div>
        </Panel>
        <Panel
          title="Upcoming exams"
          right={
            <Link className="btn link" href={hrefFor("admin", "exams")}>
              Exam schedule
            </Link>
          }
        >
          <div className="list">
            {up.length ? (
              up.map((e) => (
                <div className="row" key={e.id}>
                  <SubjectCode>{e.cls || "Cl " + e.grade}</SubjectCode>
                  <div className="grow">
                    <b>{subj(db, e.subject).name}</b>
                    <span className="muted">{e.name}</span>
                  </div>
                  <span className="mono" style={{ fontSize: ".85rem" }}>
                    {fmtDateL(e.date)}
                  </span>
                </div>
              ))
            ) : (
              <Empty>No exams scheduled. Publish a datesheet from Exam schedule.</Empty>
            )}
          </div>
        </Panel>
      </div>
      <Panel
        title="Latest notices"
        right={
          <Link className="btn link" href={hrefFor("admin", "calendar")}>
            Post a notice
          </Link>
        }
      >
        <NoticeList list={[...db.notices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)} />
      </Panel>
    </>
  );
}
