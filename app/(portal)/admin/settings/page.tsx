"use client";

import type { FormEvent } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageHead } from "@/components/PageHead";
import { Panel } from "@/components/Panel";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { Swatches } from "@/components/Swatches";
import { toast } from "@/components/Toast";
import { useDb, useStore } from "@/lib/store";
import { formValues } from "@/lib/utils";

export default function AdminSettings() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const reset = useStore((s) => s.reset);

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { g } = formValues(e.currentTarget);
    mutate((d) => {
      d.school = { ...d.school, name: g("name"), year: g("year"), board: g("board") };
    });
    toast("Settings saved");
  }

  return (
    <>
      <PageHead eyebrow={PORTAL_LABEL.admin} title="School settings" sub="These details appear in the header of every portal." />
      <Panel style={{ maxWidth: 640 }}>
        <form className="form" onSubmit={save} key={`${db.school.name}|${db.school.year}|${db.school.board}`}>
          <label className="f">
            School name
            <input type="text" name="name" defaultValue={db.school.name} required />
          </label>
          <div className="fr">
            <label className="f">
              Academic year
              <input type="text" name="year" defaultValue={db.school.year} />
            </label>
            <label className="f">
              Board
              <input type="text" name="board" defaultValue={db.school.board} />
            </label>
          </div>
          <div className="actions">
            <button className="btn primary" type="submit">
              Save settings
            </button>
          </div>
        </form>
      </Panel>
      <Panel style={{ maxWidth: 640 }} title="School colours" note="Applies to every portal: Admin, Teacher, Student and Parent.">
        <Swatches />
      </Panel>
      <Panel style={{ maxWidth: 640 }} title="Demo data">
        <p className="muted" style={{ marginBottom: 12 }}>
          Everything in this demo is saved in this browser only. Resetting restores the sample school.
        </p>
        <ConfirmButton
          className="btn ghost danger"
          onConfirm={() => {
            reset();
            toast("Sample data restored");
          }}
        >
          Reset to sample data
        </ConfirmButton>
      </Panel>
    </>
  );
}
