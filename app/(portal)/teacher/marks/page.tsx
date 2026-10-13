"use client";

import { useState, type FormEvent } from "react";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { NoClasses, TeacherHead } from "@/components/TeacherHead";
import { toast } from "@/components/Toast";
import { useTeacherCtx } from "@/lib/hooks";
import { cbse, classStudents, examsFor, gradeOf, rollOf, subj } from "@/lib/selectors";
import { pushMessage, useDb, useStore } from "@/lib/store";
import type { Exam } from "@/lib/types";
import { firstName, fmtDate, fmtDateL, formValues, today, uid } from "@/lib/utils";

function ScoreSheet({ exam, cls, tid }: { exam: Exam; cls: string; tid: string }) {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const kids = classStudents(db, cls);
  const saved = db.marks[exam.id] || {};
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(kids.map((s) => [s.id, saved[s.id] != null ? String(saved[s.id]) : ""])),
  );
  const invalid = (v: string) => v.trim() !== "" && (isNaN(Number(v)) || Number(v) < 0 || Number(v) > exam.max);
  const savedVals = kids.map((s) => saved[s.id]).filter((v): v is number => v != null);
  const avg = savedVals.length ? savedVals.reduce((a, b) => a + b, 0) / savedVals.length : null;

  function store(send: boolean) {
    if (kids.some((s) => invalid(vals[s.id] ?? ""))) {
      toast(`Marks must be between 0 and ${exam.max}. Fix the highlighted rows and save again.`);
      return;
    }
    let n = 0;
    mutate((d) => {
      const mk = (d.marks[exam.id] = d.marks[exam.id] || {});
      kids.forEach((s) => {
        const v = (vals[s.id] ?? "").trim();
        if (v === "") delete mk[s.id];
        else mk[s.id] = Number(v);
      });
      if (!send) return;
      kids.forEach((s) => {
        const m = mk[s.id];
        if (m == null) return;
        const p = Math.round((m / exam.max) * 100);
        pushMessage(d, {
          sid: s.id,
          tid,
          subject: exam.subject,
          kind: "Exam score",
          title: `${exam.name}: ${m} / ${exam.max}`,
          body: `${firstName(s.name)} scored ${m} out of ${exam.max} (${p}%, grade ${cbse(p)}) in ${subj(d, exam.subject).name}.`,
        });
        n++;
      });
      const e = d.exams.find((x) => x.id === exam.id);
      if (e) e.sent = true;
    });
    toast(send ? `Scores sent to ${n} parent${n === 1 ? "" : "s"}` : "Scores saved");
  }

  return (
    <Panel
      title={
        <div>
          <h3>
            {exam.name} · {subj(db, exam.subject).name}
          </h3>
          <span className="muted">
            {fmtDateL(exam.date)} · Max {exam.max} marks
            {avg != null ? ` · Class average ${avg.toFixed(1)} (${Math.round((avg / exam.max) * 100)}%)` : ""}
          </span>
        </div>
      }
      right={exam.sent ? <Pill tone="ok">Sent to parents</Pill> : null}
    >
      {kids.length ? (
        <>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th className="r">Marks / {exam.max}</th>
                  <th className="r">%</th>
                  <th className="r">Grade</th>
                </tr>
              </thead>
              <tbody>
                {kids.map((s) => {
                  const v = vals[s.id] ?? "";
                  const p = v.trim() !== "" && !invalid(v) ? Math.round((Number(v) / exam.max) * 100) : null;
                  return (
                    <tr key={s.id}>
                      <td className="roll">{rollOf(db, s)}</td>
                      <td>{s.name}</td>
                      <td className="r">
                        <input
                          className="mini"
                          type="number"
                          min={0}
                          max={exam.max}
                          step={0.5}
                          value={v}
                          onChange={(e) => setVals({ ...vals, [s.id]: e.target.value })}
                          aria-label={`Marks for ${s.name}`}
                          aria-invalid={invalid(v)}
                          style={invalid(v) ? { borderColor: "var(--bad)" } : undefined}
                        />
                      </td>
                      <td className="num">{p ?? "—"}</td>
                      <td className="num">
                        <b>{p != null ? cbse(p) : "—"}</b>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ marginTop: 14, justifyContent: "flex-end" }}>
            <button type="button" className="btn ghost" onClick={() => store(false)}>
              Save scores
            </button>
            <button type="button" className="btn primary" onClick={() => store(true)}>
              Save and send to parents
            </button>
          </div>
        </>
      ) : (
        <Empty>No students in this class yet. The class teacher adds them from My class roster.</Empty>
      )}
    </Panel>
  );
}

export default function TeacherMarks() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const { cls, sub, tid } = useTeacherCtx();
  const [examSel, setExamSel] = useState("");
  if (!cls) return (<><TeacherHead title="Exam scores" /><NoClasses /></>);

  const exams = examsFor(db, cls).filter((e) => e.subject === sub);
  const t0 = today();
  const selId = exams.some((e) => e.id === examSel) ? examSel : (exams.filter((e) => e.date <= t0).at(-1) || exams[0])?.id || "";
  const exam = exams.find((x) => x.id === selId);

  function addTest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    const id = uid();
    mutate((d) => {
      d.exams.push({ id, grade: gradeOf(cls!), cls: cls!, name: g("name"), subject: sub!, date: g("date"), time: "08:45", max: Number(g("max")) || 20 });
    });
    setExamSel(id);
    toast("Class test added. Enter the scores below.");
    form.reset();
  }

  return (
    <>
      <TeacherHead title="Exam scores" sub="Enter marks for exams from the school datesheet or your own class tests, then send them to parents." />
      <Panel title="Choose an exam">
        <div className="chips">
          {exams.length ? (
            exams.map((x) => (
              <button key={x.id} type="button" className="chip" aria-pressed={x.id === selId} onClick={() => setExamSel(x.id)}>
                {x.name} · {fmtDate(x.date)}
              </button>
            ))
          ) : (
            <span className="muted">No exams scheduled for this subject yet.</span>
          )}
        </div>
      </Panel>
      {exam ? <ScoreSheet key={`${exam.id}|${cls}`} exam={exam} cls={cls} tid={tid} /> : null}
      <Panel title="Add a class test" right={<span className="muted">Visible to {cls} only</span>}>
        <form className="form" onSubmit={addTest}>
          <div className="fr">
            <label className="f">
              Test name
              <input type="text" name="name" placeholder="e.g. Class test: Loops" required />
            </label>
            <label className="f">
              Date
              <input type="date" name="date" defaultValue={today()} required />
            </label>
            <label className="f">
              Max marks
              <input type="number" name="max" defaultValue={20} min={1} required />
            </label>
          </div>
          <div className="actions">
            <button className="btn ghost" type="submit">
              Add test
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
