"use client";

import { PageHead } from "@/components/PageHead";
import { Panel } from "@/components/Panel";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { toast } from "@/components/Toast";
import { classStudents, tName } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { GRADES, LETTERS } from "@/lib/utils";

export default function AdminClasses() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);

  function plus(g: number) {
    if (db.sections[g] >= LETTERS.length) return toast("A class can have at most 8 sections.");
    mutate((d) => {
      d.sections[g] = (d.sections[g] || 0) + 1;
    });
    toast(`Section ${g}-${LETTERS[db.sections[g]]} added`);
  }

  function minus(g: number) {
    const n = db.sections[g];
    if (!n) return;
    const c = `${g}-${LETTERS[n - 1]}`;
    if (classStudents(db, c).length) return toast(`${c} still has students. Move or remove them before deleting the section.`);
    mutate((d) => {
      d.sections[g]--;
      delete d.classTeacher[c];
      delete d.timetable[c];
    });
    toast(`Section ${c} removed`);
  }

  function setClassTeacher(c: string, v: string) {
    mutate((d) => {
      if (v) d.classTeacher[c] = v;
      else delete d.classTeacher[c];
    });
    toast(v ? `${tName(db, v)} is now class teacher of ${c}` : "Class teacher removed");
  }

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Classes & sections"
        sub="Set how many sections each class has and assign a class teacher to each. The class teacher adds the student names for their section."
      />
      <Panel>
        {GRADES.map((g) => (
          <div className="sec-row" key={g}>
            <div>
              <h3>Class {g}</h3>
              <div className="stepper" role="group" aria-label={`Sections in class ${g}`}>
                <button type="button" onClick={() => minus(g)} aria-label="Remove a section">
                  −
                </button>
                <span>{db.sections[g] || 0}</span>
                <button type="button" onClick={() => plus(g)} aria-label="Add a section">
                  +
                </button>
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                sections
              </div>
            </div>
            <div className="sections">
              {db.sections[g] ? (
                Array.from({ length: db.sections[g] }, (_, i) => {
                  const c = `${g}-${LETTERS[i]}`;
                  const n = classStudents(db, c).length;
                  const p = Object.keys(db.timetable[c] || {}).length;
                  return (
                    <div className="sec" key={c}>
                      <div className="top-l">
                        <b>{c}</b>
                        <span className="muted mono">
                          {n} students · {p}/30 periods
                        </span>
                      </div>
                      <label className="f">
                        Class teacher
                        <select value={db.classTeacher[c] || ""} onChange={(e) => setClassTeacher(c, e.target.value)}>
                          <option value="">— Not assigned —</option>
                          {db.teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  );
                })
              ) : (
                <span className="muted">No sections. Use + to add one.</span>
              )}
            </div>
          </div>
        ))}
      </Panel>
    </>
  );
}
