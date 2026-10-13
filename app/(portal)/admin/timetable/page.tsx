"use client";

import { useState } from "react";
import { PageHead } from "@/components/PageHead";
import { Panel } from "@/components/Panel";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { TimetableGrid } from "@/components/TimetableGrid";
import { toast } from "@/components/Toast";
import { allClasses, periodsPerWeek, shortNameOf, subj, tName } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { PERIODS } from "@/lib/utils";

export default function AdminTimetable() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const ttCls = useStore((s) => s.ui.ttCls);
  const setUi = useStore((s) => s.setUi);
  const [cell, setCell] = useState<string | null>(null);
  const [ttSub, setTtSub] = useState("");
  const [tSel, setTSel] = useState("");

  const classes = allClasses(db);
  const cls = classes.includes(ttCls) ? ttCls : classes[0];
  const tt = (cls && db.timetable[cls]) || {};
  const cur = cell ? tt[cell] : undefined;
  const heads = db.teachers.filter((t) => t.subjects.includes(ttSub));
  const teacherId = heads.some((h) => h.id === tSel)
    ? tSel
    : cur?.subject === ttSub && heads.some((h) => h.id === cur.teacher)
      ? cur.teacher
      : (heads[0]?.id ?? "");

  function openCell(k: string) {
    if (cell === k) return setCell(null);
    setCell(k);
    setTtSub(tt[k]?.subject || "");
    setTSel("");
  }

  function save() {
    if (!cell || !cls) return;
    if (!ttSub || !teacherId) return toast("Choose a subject and a teacher who heads it.");
    const clash = Object.entries(db.timetable).find(([c, t]) => c !== cls && t[cell]?.teacher === teacherId);
    if (clash) return toast(`${tName(db, teacherId)} already teaches ${clash[0]} in this period. Pick another teacher or period.`);
    mutate((d) => {
      (d.timetable[cls] = d.timetable[cls] || {})[cell] = { subject: ttSub, teacher: teacherId };
    });
    toast("Period saved");
    setCell(null);
  }

  function clear() {
    if (!cell || !cls) return;
    mutate((d) => {
      delete d.timetable[cls]?.[cell];
    });
    setCell(null);
    toast("Period cleared");
  }

  const [d, p] = cell ? cell.split("-") : ["", "0"];

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Timetables"
        sub="Choose a section, then click a period to set its subject and teacher."
        right={
          <label className="f">
            Section
            <select
              value={cls ?? ""}
              onChange={(e) => {
                setUi({ ttCls: e.target.value });
                setCell(null);
              }}
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </label>
        }
      />
      {cls ? (
        <Panel
          title={`Class ${cls} weekly timetable`}
          right={
            <span className="muted">
              {Object.keys(tt).length} of 30 periods set · Class teacher: {tName(db, db.classTeacher[cls])}
            </span>
          }
        >
          <TimetableGrid
            cell={(day, period) => {
              const k = `${day}-${period}`;
              const s = tt[k];
              return (
                <button type="button" className={`slot ${s ? "filled" : "empty-s"}`} aria-pressed={cell === k} onClick={() => openCell(k)}>
                  {s ? (
                    <>
                      <b>{subj(db, s.subject).name}</b>
                      <span>{shortNameOf(db, s.teacher)}</span>
                    </>
                  ) : (
                    "+ Add"
                  )}
                </button>
              );
            }}
          />
        </Panel>
      ) : null}
      {cell && cls ? (
        <Panel
          title={
            <h3>
              {cls} · {d} · Period {p}{" "}
              <span className="muted mono" style={{ fontWeight: 400 }}>
                {PERIODS[Number(p) - 1][0]}–{PERIODS[Number(p) - 1][1]}
              </span>
            </h3>
          }
          right={
            <button type="button" className="btn link" onClick={() => setCell(null)}>
              Close
            </button>
          }
        >
          <div className="fr">
            <label className="f">
              Subject
              <select
                value={ttSub}
                onChange={(e) => {
                  setTtSub(e.target.value);
                  setTSel("");
                }}
              >
                <option value="">Choose a subject</option>
                {db.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              Teacher
              <select value={teacherId} onChange={(e) => setTSel(e.target.value)}>
                {!ttSub ? (
                  <option value="">Choose a subject first</option>
                ) : heads.length ? (
                  heads.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({periodsPerWeek(db, t.id)} periods)
                    </option>
                  ))
                ) : (
                  <option value="">No teacher heads this subject</option>
                )}
              </select>
            </label>
          </div>
          <div className="actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn primary" onClick={save}>
              Save period
            </button>
            {cur ? (
              <button type="button" className="btn ghost danger" onClick={clear}>
                Clear period
              </button>
            ) : null}
            <span className="muted">The portal blocks a teacher from being in two classes at once.</span>
          </div>
        </Panel>
      ) : null}
    </>
  );
}
