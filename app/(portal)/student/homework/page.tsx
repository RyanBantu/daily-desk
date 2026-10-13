"use client";

import { useState, type FormEvent } from "react";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { StudentHead } from "@/components/StudentHead";
import { SubjectCode } from "@/components/SubjectCode";
import { toast } from "@/components/Toast";
import { useMe } from "@/lib/hooks";
import { dueState, subFor, subj } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { fmtDateL, formValues, readFile, uid } from "@/lib/utils";

export default function StudentHomework() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const s = useMe();
  const [openUpload, setOpenUpload] = useState<string | null>(null);
  if (!s) return null;
  const list = db.homework.filter((h) => h.cls === s.cls).sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));

  async function submit(e: FormEvent<HTMLFormElement>, hw: string) {
    e.preventDefault();
    const { fd, g } = formValues(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || !file.size) return toast("Choose a file to upload.");
    const meta = await readFile(file);
    mutate((d) => {
      d.submissions.push({ id: uid(), hw, sid: s!.id, file: meta, comment: g("comment"), time: new Date().toISOString(), status: "pending", score: null, remark: "", shared: false });
    });
    setOpenUpload(null);
    toast("Homework submitted");
  }

  return (
    <>
      <StudentHead title="Homework" sub="Finish the work, then upload a file or a photo of your notebook." />
      <Panel>
        <div className="list">
          {list.length ? (
            list.map((h) => {
              const [l, c] = dueState(db, h, s.id);
              const sb = subFor(db, h.id, s.id);
              return (
                <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap" }} key={h.id}>
                  <div className="grow">
                    <div className="actions" style={{ gap: 8, marginBottom: 4 }}>
                      <SubjectCode>{subj(db, h.subject).code}</SubjectCode>
                      <span className="muted">Due {fmtDateL(h.due)}</span>
                    </div>
                    <b>{h.title}</b>
                    <p style={{ color: "var(--ink-2)", marginTop: 2 }}>{h.instructions}</p>
                    {sb ? (
                      <>
                        <div className="attach" style={{ marginTop: 8 }}>
                          <span>Uploaded: {sb.file.name}</span>
                        </div>
                        {sb.status === "reviewed" ? (
                          <div className="quote" style={{ marginTop: 8 }}>
                            <b>{sb.score != null ? sb.score + " / 10 · " : ""}</b>
                            {sb.remark || "Checked"}
                          </div>
                        ) : null}
                      </>
                    ) : openUpload === h.id ? (
                      <form className="form inset" style={{ marginTop: 10 }} onSubmit={(e) => submit(e, h.id)}>
                        <label className="f">
                          Your work
                          <input type="file" name="file" required accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt,.java,.py,.zip" />
                        </label>
                        <label className="f">
                          Note to teacher (optional)
                          <input type="text" name="comment" />
                        </label>
                        <div className="actions">
                          <button className="btn primary" type="submit">
                            Submit
                          </button>
                          <button className="btn link" type="button" onClick={() => setOpenUpload(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button type="button" className="btn primary sm" style={{ marginTop: 8 }} onClick={() => setOpenUpload(h.id)}>
                        Upload homework
                      </button>
                    )}
                  </div>
                  <Pill tone={c}>{l}</Pill>
                </div>
              );
            })
          ) : (
            <Empty>No homework assigned. Work your subject teachers set will appear here.</Empty>
          )}
        </div>
      </Panel>
    </>
  );
}
