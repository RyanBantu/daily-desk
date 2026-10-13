"use client";

import type { FormEvent } from "react";
import { MaterialCard } from "@/components/MaterialCard";
import { Empty, Panel } from "@/components/Panel";
import { NoClasses, TeacherHead } from "@/components/TeacherHead";
import { toast } from "@/components/Toast";
import { useTeacherCtx } from "@/lib/hooks";
import { useDb, useStore } from "@/lib/store";
import { formValues, readFile, today, uid } from "@/lib/utils";

export default function TeacherMaterials() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const { cls, sub } = useTeacherCtx();
  if (!cls) return (<><TeacherHead title="Course material" /><NoClasses /></>);

  const list = db.materials.filter((m) => m.cls === cls && m.subject === sub).sort((a, b) => b.date.localeCompare(a.date));

  async function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { fd, g } = formValues(form);
    const file = fd.get("file");
    const hasFile = file instanceof File && file.size > 0;
    if (!g("text") && !hasFile) return toast("Add some notes or attach a file.");
    const meta = hasFile ? await readFile(file) : null;
    mutate((d) => {
      d.materials.push({ id: uid(), cls: cls!, subject: sub!, title: g("title"), text: g("text"), file: meta, date: today() });
    });
    toast("Published to " + cls);
    form.reset();
  }

  return (
    <>
      <TeacherHead title="Course material" sub="Upload notes, worksheets and slides. Students in this class can open them any time." />
      <Panel title="Upload material">
        <form className="form" onSubmit={publish}>
          <label className="f">
            Topic
            <input type="text" name="title" placeholder="e.g. Loops: worked examples" required />
          </label>
          <label className="f">
            Notes
            <textarea name="text" rows={4} placeholder="Key points, what to revise, page numbers…" />
          </label>
          <label className="f">
            File (optional)
            <input type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png" />
          </label>
          <div className="actions">
            <button className="btn primary" type="submit">
              Publish to {cls}
            </button>
          </div>
        </form>
      </Panel>
      <Panel title={`Published (${list.length})`}>
        {list.length ? (
          list.map((m) => (
            <MaterialCard
              key={m.id}
              m={m}
              onRemove={() => {
                mutate((d) => {
                  d.materials = d.materials.filter((x) => x.id !== m.id);
                });
                toast("Material removed");
              }}
            />
          ))
        ) : (
          <Empty>Nothing uploaded yet. Material you publish here appears in your students’ Course material.</Empty>
        )}
      </Panel>
    </>
  );
}
