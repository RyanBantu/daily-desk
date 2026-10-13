"use client";

import { useRouter } from "next/navigation";
import { DeadlineList } from "@/components/DeadlineList";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { StatRow } from "@/components/StatRow";
import { useTeacher, useTeacherCtx } from "@/lib/hooks";
import { classTeacherOf, gradeOf, pendingSubmissions, periodsPerWeek, scopeMatch, subj } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { PERIODS, fmtDateL, today, weekdayKey } from "@/lib/utils";

export default function TeacherToday() {
  const db = useDb();
  const router = useRouter();
  const setUi = useStore((s) => s.setUi);
  const t = useTeacher();
  const { ctxs } = useTeacherCtx();
  if (!t) return null;

  const t0 = today();
  const isSchoolDay = !!weekdayKey(t0);
  const wd = weekdayKey(t0) || "Mon";
  const slots: { cls: string; p: number; sub: string }[] = [];
  Object.entries(db.timetable).forEach(([cls, tt]) =>
    PERIODS.forEach((_, i) => {
      const s = tt[`${wd}-${i + 1}`];
      if (s?.teacher === t.id) slots.push({ cls, p: i + 1, sub: s.subject });
    }),
  );
  slots.sort((a, b) => a.p - b.p);

  const toReview = pendingSubmissions(db, ctxs).length;
  const myExams = db.exams.filter((e) =>
    ctxs.some((k) => {
      const [c, s] = k.split("|");
      return e.subject === s && e.grade === gradeOf(c) && (!e.cls || e.cls === c);
    }),
  );
  const awaiting = myExams.filter((e) => e.date < t0 && !Object.keys(db.marks[e.id] || {}).length).length;
  const ct = classTeacherOf(db, t.id);
  const coming = db.deadlines
    .filter((d) => d.date >= t0 && ctxs.some((k) => scopeMatch(d.scope, k.split("|")[0]) && (!d.subject || d.subject === k.split("|")[1])))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.teacher}
        title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${t.name}`}
        sub={`${t.subjects.map((s) => subj(db, s).name).join(", ") || "No subjects assigned"}${ct.length ? ` · Class teacher of ${ct.join(", ")}` : ""}`}
      />
      <StatRow
        items={[
          { label: "Periods today", value: slots.length, caption: isSchoolDay ? fmtDateL(t0) : "No school today, showing Monday" },
          { label: "Homework to check", value: toReview, caption: "submissions waiting" },
          { label: "Scores to enter", value: awaiting, caption: "exams already held" },
          { label: "Weekly load", value: periodsPerWeek(db, t.id), caption: `periods across ${new Set(ctxs.map((k) => k.split("|")[0])).size} sections` },
        ]}
      />
      <div className="grid2">
        <Panel title="Today's periods">
          <div className="list">
            {slots.length ? (
              slots.map((s) => {
                const done = !!db.attendance[`${s.cls}|${s.sub}|${t0}`];
                return (
                  <div className="row" key={s.cls + s.p}>
                    <span className="mono" style={{ fontSize: ".8rem", color: "var(--muted)", width: 92 }}>
                      P{s.p} · {PERIODS[s.p - 1][0]}
                    </span>
                    <div className="grow">
                      <b>
                        {s.cls} · {subj(db, s.sub).name}
                      </b>
                    </div>
                    {isSchoolDay ? (
                      done ? (
                        <Pill tone="ok">Attendance taken</Pill>
                      ) : (
                        <button
                          type="button"
                          className="btn primary sm"
                          onClick={() => {
                            setUi({ tctx: `${s.cls}|${s.sub}` });
                            router.push("/teacher/attendance");
                          }}
                        >
                          Take attendance
                        </button>
                      )
                    ) : null}
                  </div>
                );
              })
            ) : (
              <Empty>No periods today. Your timetable is set by the school office.</Empty>
            )}
          </div>
        </Panel>
        <Panel title="Coming up">
          <DeadlineList list={coming} emptyMsg="No deadlines coming up for your classes." />
        </Panel>
      </div>
    </>
  );
}
