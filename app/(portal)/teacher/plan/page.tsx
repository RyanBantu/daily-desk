"use client";

import type { FormEvent } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CourseTimeline } from "@/components/CourseTimeline";
import { Empty, Panel } from "@/components/Panel";
import { NoClasses, TeacherHead } from "@/components/TeacherHead";
import { toast } from "@/components/Toast";
import { useTeacherCtx } from "@/lib/hooks";
import { useDb, useStore } from "@/lib/store";
import { dayOffset, fmtDateL, formValues, today, uid } from "@/lib/utils";

export default function TeacherPlan() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const { cls, sub, tid } = useTeacherCtx();
  if (!cls) return (<><TeacherHead title="Course timeline" /><NoClasses /></>);

  const units = db.plan.filter((u) => u.cls === cls && u.subject === sub);
  const dls = db.deadlines.filter((d) => d.scope === cls && d.subject === sub).sort((a, b) => a.date.localeCompare(b.date));

  function addUnit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    if (g("end") < g("start")) return toast("The end date must be on or after the start date.");
    mutate((d) => {
      d.plan.push({ id: uid(), cls: cls!, subject: sub!, title: g("title"), start: g("start"), end: g("end") });
    });
    toast("Unit added to the timeline");
    form.reset();
  }

  function addDeadline(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    mutate((d) => {
      d.deadlines.push({ id: uid(), scope: cls!, subject: sub!, title: g("title"), date: g("date"), by: tid });
    });
    toast("Deadline added for " + cls);
    form.reset();
  }

  return (
    <>
      <TeacherHead title="Course timeline & deadlines" sub="Plan units for the term and set deadlines for this class. Students see the same timeline." />
      <Panel title="Term plan">
        <CourseTimeline units={units} emptyMsg="No units planned yet. Add the first one below." />
      </Panel>
      <div className="grid2">
        <Panel title="Add a unit">
          <form className="form" onSubmit={addUnit}>
            <label className="f">
              Unit or chapter
              <input type="text" name="title" placeholder="e.g. Ch 7 · Strings" required />
            </label>
            <div className="fr">
              <label className="f">
                Starts
                <input type="date" name="start" defaultValue={today()} required />
              </label>
              <label className="f">
                Ends
                <input type="date" name="end" defaultValue={dayOffset(14)} required />
              </label>
            </div>
            <div className="actions">
              <button className="btn primary" type="submit">
                Add to timeline
              </button>
            </div>
          </form>
          {units.length ? (
            <div className="list" style={{ marginTop: 14 }}>
              {units.map((u) => (
                <div className="row" key={u.id}>
                  <div className="grow">{u.title}</div>
                  <ConfirmButton
                    onConfirm={() => {
                      mutate((d) => {
                        d.plan = d.plan.filter((x) => x.id !== u.id);
                      });
                      toast("Unit removed");
                    }}
                  >
                    Remove
                  </ConfirmButton>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>
        <Panel title="Class deadlines">
          <form className="form" onSubmit={addDeadline}>
            <div className="fr">
              <label className="f">
                What is due
                <input type="text" name="title" placeholder="e.g. Project report" required />
              </label>
              <label className="f">
                Date
                <input type="date" name="date" defaultValue={dayOffset(7)} required />
              </label>
            </div>
            <div className="actions">
              <button className="btn primary" type="submit">
                Add deadline
              </button>
            </div>
          </form>
          <div className="list" style={{ marginTop: 14 }}>
            {dls.length ? (
              dls.map((d) => (
                <div className="row" key={d.id}>
                  <div className="grow">
                    <b>{d.title}</b>
                    <span className="muted">{fmtDateL(d.date)}</span>
                  </div>
                  <ConfirmButton
                    onConfirm={() => {
                      mutate((db) => {
                        db.deadlines = db.deadlines.filter((x) => x.id !== d.id);
                      });
                      toast("Deadline removed");
                    }}
                  >
                    Remove
                  </ConfirmButton>
                </div>
              ))
            ) : (
              <Empty>No deadlines set. Students in {cls} see them on their course timeline.</Empty>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
