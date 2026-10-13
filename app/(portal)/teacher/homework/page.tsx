"use client";

import { useState, type FormEvent } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Thumb } from "@/components/MaterialCard";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { NoClasses, TeacherHead } from "@/components/TeacherHead";
import { toast } from "@/components/Toast";
import { useTeacherCtx } from "@/lib/hooks";
import { classStudents, student } from "@/lib/selectors";
import { pushMessage, useDb, useStore } from "@/lib/store";
import type { DB, Submission } from "@/lib/types";
import { dayOffset, firstName, fmtDateL, fmtSize, fmtStamp, formValues, initials, today, uid } from "@/lib/utils";

function shareSubmission(d: DB, s: Submission, tid: string) {
  const h = d.homework.find((x) => x.id === s.hw);
  if (!h) return;
  s.shared = true;
  pushMessage(d, {
    sid: s.sid,
    tid,
    subject: h.subject,
    kind: "Homework",
    title: `${h.title}${s.score != null ? ": " + s.score + " / 10" : ""}`,
    body: s.remark || "Homework checked and complete.",
  });
}

function ReviewForm({ s, tid }: { s: Submission; tid: string }) {
  const db = useDb();
  const mutate = useStore((st) => st.mutate);
  const [score, setScore] = useState("");
  const [remark, setRemark] = useState("");
  const [share, setShare] = useState(true);
  const st = student(db, s.sid);

  function review() {
    if (score !== "" && (isNaN(+score) || +score < 0 || +score > 10)) return toast("Score must be between 0 and 10.");
    mutate((d) => {
      const x = d.submissions.find((y) => y.id === s.id);
      if (!x) return;
      x.score = score === "" ? null : +score;
      x.remark = remark.trim();
      x.status = "reviewed";
      if (share) shareSubmission(d, x, tid);
    });
    toast(share ? "Checked and sent to parent" : "Marked checked");
  }

  return (
    <div className="inset" style={{ marginTop: 10 }}>
      <div className="fr">
        <label className="f">
          Score out of 10
          <input type="number" min={0} max={10} step={0.5} value={score} onChange={(e) => setScore(e.target.value)} />
        </label>
        <label className="f" style={{ gridColumn: "span 2" }}>
          Remark
          <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder={`Feedback for ${firstName(st?.name ?? "")}`} />
        </label>
      </div>
      <div className="actions" style={{ marginTop: 10 }}>
        <label className="check">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /> Send score and remark to parent
        </label>
        <button type="button" className="btn primary sm" onClick={review}>
          Mark checked
        </button>
      </div>
    </div>
  );
}

export default function TeacherHomework() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const { cls, sub, tid } = useTeacherCtx();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  if (!cls) return (<><TeacherHead title="Homework" /><NoClasses /></>);

  const list = db.homework.filter((h) => h.cls === cls && h.subject === sub).sort((a, b) => (b.due || "").localeCompare(a.due || ""));
  const ids = list.map((h) => h.id);
  const all = db.submissions.filter((s) => ids.includes(s.hw)).sort((a, b) => b.time.localeCompare(a.time));
  const pending = all.filter((s) => s.status === "pending");
  const shown = filter === "pending" ? pending : all;
  const n = classStudents(db, cls).length;

  function assign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { g } = formValues(form);
    mutate((d) => {
      d.homework.push({ id: uid(), cls: cls!, subject: sub!, title: g("title"), instructions: g("instructions"), due: g("due"), created: today() });
    });
    toast("Homework assigned to " + cls);
    form.reset();
  }

  return (
    <>
      <TeacherHead title="Homework" sub="Assign work, check what comes in, score it and send your remarks to parents." />
      <div className="grid2">
        <Panel title="Assign homework">
          <form className="form" onSubmit={assign}>
            <label className="f">
              Title
              <input type="text" name="title" placeholder="e.g. Exercise 5.3, Q1–8" required />
            </label>
            <label className="f">
              Instructions
              <textarea name="instructions" rows={3} required placeholder="What to do and what to upload" />
            </label>
            <label className="f">
              Due date
              <input type="date" name="due" defaultValue={dayOffset(2)} />
            </label>
            <div className="actions">
              <button className="btn primary" type="submit">
                Assign to {cls}
              </button>
            </div>
          </form>
        </Panel>
        <Panel title="Assigned">
          <div className="list">
            {list.length ? (
              list.map((h) => {
                const k = db.submissions.filter((s) => s.hw === h.id).length;
                return (
                  <div className="row" key={h.id}>
                    <div className="grow">
                      <b>{h.title}</b>
                      <span className="muted">Due {fmtDateL(h.due)}</span>
                    </div>
                    <div className="r">
                      <div className="mono" style={{ fontSize: ".85rem" }}>
                        {k}/{n}
                      </div>
                      <span className="muted">submitted</span>
                    </div>
                    <ConfirmButton
                      onConfirm={() => {
                        mutate((d) => {
                          d.homework = d.homework.filter((x) => x.id !== h.id);
                          d.submissions = d.submissions.filter((s) => s.hw !== h.id);
                        });
                        toast("Homework removed");
                      }}
                    >
                      Remove
                    </ConfirmButton>
                  </div>
                );
              })
            ) : (
              <Empty>Nothing assigned yet. Homework you assign shows up for every student in {cls}.</Empty>
            )}
          </div>
        </Panel>
      </div>
      <Panel
        title="Submissions"
        right={
          <div className="chips">
            <button type="button" className="chip" aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>
              To check ({pending.length})
            </button>
            <button type="button" className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All ({all.length})
            </button>
          </div>
        }
      >
        <div className="list">
          {shown.length ? (
            shown.map((s) => {
              const h = db.homework.find((x) => x.id === s.hw);
              const st = student(db, s.sid);
              return (
                <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap" }} key={s.id}>
                  <div className="avatar">{initials(st?.name || "?")}</div>
                  <div className="grow">
                    <b>
                      {st?.name}{" "}
                      <span className="muted" style={{ fontWeight: 400 }}>
                        · {h?.title}
                      </span>
                    </b>
                    <div className="actions" style={{ marginTop: 6, gap: 8 }}>
                      <div className="attach">
                        <span>{s.file.name}</span>
                        <span className="muted">{fmtSize(s.file.size)}</span>
                      </div>
                      <span className="muted">{fmtStamp(s.time)}</span>
                    </div>
                    <Thumb file={s.file} style={{ marginTop: 8 }} />
                    {s.comment ? (
                      <p className="muted" style={{ marginTop: 6 }}>
                        Student: “{s.comment}”
                      </p>
                    ) : null}
                    {s.status === "reviewed" ? (
                      <div className="quote" style={{ marginTop: 8 }}>
                        <b>{s.score != null ? s.score + " / 10 · " : ""}</b>
                        {s.remark || "Checked"}
                      </div>
                    ) : (
                      <ReviewForm s={s} tid={tid} />
                    )}
                  </div>
                  {s.status === "reviewed" ? (
                    s.shared ? (
                      <Pill tone="ok">Sent to parent</Pill>
                    ) : (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => {
                          mutate((d) => {
                            const x = d.submissions.find((y) => y.id === s.id);
                            if (x) shareSubmission(d, x, tid);
                          });
                          toast("Sent to parent");
                        }}
                      >
                        Send to parent
                      </button>
                    )
                  ) : (
                    <Pill tone="warn">To check</Pill>
                  )}
                </div>
              );
            })
          ) : (
            <Empty>All caught up. Nothing waiting to be checked.</Empty>
          )}
        </div>
      </Panel>
    </>
  );
}
