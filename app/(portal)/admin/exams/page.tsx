"use client";

import { useState, type FormEvent } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { toast } from "@/components/Toast";
import { gradeOf, subj } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { EXAM_NAMES, GRADES, addDays, dayOffset, fmtDateL, fmtTime, formValues, nextSchoolDay, today, uid } from "@/lib/utils";

export default function AdminExams() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const [examGrade, setExamGrade] = useState("all");
  const list = db.exams
    .filter((e) => examGrade === "all" || e.grade === Number(examGrade))
    .sort((a, b) => a.date.localeCompare(b.date));

  function addExam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    const grade = Number(g("grade"));
    const subjS = g("subject");
    const taught =
      subjS === "*"
        ? db.subjects
            .map((s) => s.id)
            .filter((s) => Object.entries(db.timetable).some(([c, tt]) => gradeOf(c) === grade && Object.values(tt).some((x) => x.subject === s)))
        : [subjS];
    const use = taught.length ? taught : db.subjects.map((s) => s.id);
    let d = g("date");
    mutate((db) => {
      use.forEach((s) => {
        d = nextSchoolDay(d);
        db.exams.push({ id: uid(), grade, cls: null, name: g("name"), subject: s, date: d, time: g("time") || "09:00", max: Number(g("max")) || 80 });
        d = addDays(d, 1);
      });
    });
    setExamGrade(String(grade));
    toast(`${use.length} paper${use.length > 1 ? "s" : ""} added to the Class ${grade} datesheet`);
    form.reset();
  }

  function removeExam(id: string) {
    mutate((d) => {
      d.exams = d.exams.filter((e) => e.id !== id);
      delete d.marks[id];
    });
    toast("Exam removed");
  }

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Exam schedule"
        sub="Publish datesheets for each class. Students and parents see them straight away; teachers enter scores against them."
      />
      <Panel title="Schedule an exam">
        <form className="form" onSubmit={addExam}>
          <div className="fr">
            <label className="f">
              Class
              <select name="grade" defaultValue="10">
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    Class {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              Exam
              <input type="text" name="name" list="examNames" placeholder="e.g. Term 1 Examination" required />
              <datalist id="examNames">
                {EXAM_NAMES.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </label>
            <label className="f">
              Subject
              <select name="subject" defaultValue="*">
                <option value="*">Every subject (one per school day)</option>
                {db.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="fr">
            <label className="f">
              Date (first paper)
              <input type="date" name="date" defaultValue={nextSchoolDay(dayOffset(14))} required />
            </label>
            <label className="f">
              Start time
              <input type="time" name="time" defaultValue="09:00" />
            </label>
            <label className="f">
              Maximum marks
              <input type="number" name="max" defaultValue={80} min={1} max={200} />
            </label>
          </div>
          <div className="actions">
            <button className="btn primary" type="submit">
              Publish to datesheet
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Datesheet"
        right={
          <div className="chips">
            <button type="button" className="chip" aria-pressed={examGrade === "all"} onClick={() => setExamGrade("all")}>
              All
            </button>
            {GRADES.map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={examGrade === String(g)} onClick={() => setExamGrade(String(g))}>
                {g}
              </button>
            ))}
          </div>
        }
      >
        {list.length ? (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Class</th>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th className="r">Max</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((e) => {
                  const done = e.date < today();
                  const entered = Object.keys(db.marks[e.id] || {}).length;
                  return (
                    <tr key={e.id}>
                      <td>{fmtDateL(e.date)}</td>
                      <td className="mono">{fmtTime(e.time)}</td>
                      <td>{e.cls || "Class " + e.grade}</td>
                      <td>{e.name}</td>
                      <td>{subj(db, e.subject).name}</td>
                      <td className="num">{e.max}</td>
                      <td>
                        {done ? (
                          entered ? (
                            <Pill tone="ok">{entered} scores in</Pill>
                          ) : (
                            <Pill tone="warn">Awaiting scores</Pill>
                          )
                        ) : (
                          <Pill tone="info">Scheduled</Pill>
                        )}
                      </td>
                      <td className="r">
                        <ConfirmButton onConfirm={() => removeExam(e.id)}>Remove</ConfirmButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No exams for this class yet. Use the form above to publish a datesheet.</Empty>
        )}
      </Panel>
    </>
  );
}
