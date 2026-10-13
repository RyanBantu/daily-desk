"use client";

import type { FormEvent } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { NoticeList } from "@/components/NoticeList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { toast } from "@/components/Toast";
import { scopeLabel, scopeOpts } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import type { NoticeCategory } from "@/lib/types";
import { NOTICE_CATS, dayOffset, fmtDateL, formValues, today, uid } from "@/lib/utils";

export default function AdminCalendar() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const scopes = scopeOpts(db);

  function addDeadline(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    mutate((d) => {
      d.deadlines.push({ id: uid(), scope: g("scope"), title: g("title"), date: g("date"), by: "admin" });
    });
    toast("Deadline added");
    form.reset();
  }

  function addNotice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    mutate((d) => {
      d.notices.push({ id: uid(), title: g("title"), body: g("body"), category: g("category") as NoticeCategory, scope: g("scope"), date: today() });
    });
    toast("Notice published");
    form.reset();
  }

  const scopeSelect = (
    <select name="scope" defaultValue="all">
      {scopes.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );

  const adminDeadlines = db.deadlines.filter((d) => d.by === "admin").sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Deadlines & notices"
        sub="School-wide deadlines and announcements, including inspection visits. Choose who sees each one."
      />
      <div className="grid2">
        <Panel title="Add a deadline">
          <form className="form" onSubmit={addDeadline}>
            <label className="f">
              What is due
              <input type="text" name="title" placeholder="e.g. Annual day costume forms" required />
            </label>
            <div className="fr">
              <label className="f">
                Applies to
                {scopeSelect}
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
          <div className="list" style={{ marginTop: 18 }}>
            {adminDeadlines.length ? (
              adminDeadlines.map((d) => (
                <div className="row" key={d.id}>
                  <div className="grow">
                    <b>{d.title}</b>
                    <span className="muted">
                      {scopeLabel(d.scope)} · {fmtDateL(d.date)}
                    </span>
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
              <Empty>No deadlines yet. Add one above and it appears for the chosen classes.</Empty>
            )}
          </div>
        </Panel>
        <Panel title="Post a notice">
          <form className="form" onSubmit={addNotice}>
            <label className="f">
              Title
              <input type="text" name="title" placeholder="e.g. Fire safety inspection on Monday" required />
            </label>
            <div className="fr">
              <label className="f">
                Category
                <select name="category" defaultValue="General">
                  {NOTICE_CATS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="f">
                Audience
                {scopeSelect}
              </label>
            </div>
            <label className="f">
              Details
              <textarea name="body" rows={3} placeholder="What students and parents need to know or prepare" required />
            </label>
            <div className="actions">
              <button className="btn primary" type="submit">
                Publish notice
              </button>
            </div>
          </form>
        </Panel>
      </div>
      <Panel title="Published notices">
        <NoticeList
          list={[...db.notices].sort((a, b) => b.date.localeCompare(a.date))}
          emptyMsg="No notices yet. Publish one above and students and parents see it straight away."
          onRemove={(id) => {
            mutate((d) => {
              d.notices = d.notices.filter((n) => n.id !== id);
            });
            toast("Notice removed");
          }}
        />
      </Panel>
    </>
  );
}
