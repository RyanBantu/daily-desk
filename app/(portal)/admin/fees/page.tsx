"use client";

import { useMemo, useState } from "react";
import { KpiRow } from "@/components/kpi-row";
import { PageHead } from "@/components/PageHead";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { PORTAL_LABEL } from "@/components/Sidebar";
import { toast } from "@/components/Toast";
import { feeBalance, feeLabel, feeStatus, feeTone, feeTotals } from "@/lib/fees";
import { allClasses, student } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import { fmtDate, inr, today } from "@/lib/utils";

export default function AdminFees() {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const [cls, setCls] = useState("all");
  const [status, setStatus] = useState("open");
  const sids = useMemo(
    () => (cls === "all" ? db.students.map((s) => s.id) : db.students.filter((s) => s.cls === cls).map((s) => s.id)),
    [db.students, cls],
  );
  const totals = feeTotals(db, sids);
  const rows = db.fees
    .filter((f) => sids.includes(f.sid))
    .filter((f) => (status === "all" ? true : status === "open" ? feeStatus(f) !== "paid" : feeStatus(f) === status))
    .sort((a, b) => a.due.localeCompare(b.due) || (student(db, a.sid)?.name || "").localeCompare(student(db, b.sid)?.name || ""));

  function collect(id: string) {
    mutate((d) => {
      const f = d.fees.find((x) => x.id === id);
      if (!f) return;
      f.paid = f.amount;
      f.paidOn = today();
    });
    toast("Payment recorded");
  }

  return (
    <>
      <PageHead
        eyebrow={PORTAL_LABEL.admin}
        title="Fees"
        sub="Term bills for every student. Record a collection here; the linked parent sees the same balance the same day."
        right={
          <div className="actions">
            <label className="f">
              Section
              <select value={cls} onChange={(e) => setCls(e.target.value)}>
                <option value="all">Whole school</option>
                {allClasses(db)
                  .filter((c) => db.students.some((s) => s.cls === c))
                  .map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
              </select>
            </label>
            <label className="f">
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">Outstanding</option>
                <option value="all">All</option>
                <option value="overdue">Overdue</option>
                <option value="due">Due</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </label>
          </div>
        }
      />
      <KpiRow
        items={[
          { label: "Billed", value: inr(totals.billed), caption: `${totals.n} fee lines` },
          { label: "Collected", value: inr(totals.collected), caption: totals.billed ? `${Math.round((totals.collected / totals.billed) * 100)}% of billed` : "No bills yet" },
          { label: "Outstanding", value: inr(totals.outstanding), caption: "Still to collect" },
          { label: "Overdue", value: inr(totals.overdue), caption: "Past the due date" },
        ]}
      />
      <Panel>
        {rows.length ? (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Head</th>
                  <th>Due</th>
                  <th className="r">Amount</th>
                  <th className="r">Paid</th>
                  <th className="r">Balance</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const s = student(db, f.sid);
                  const st = feeStatus(f);
                  return (
                    <tr key={f.id}>
                      <td>
                        <b>{s?.name ?? "—"}</b>
                      </td>
                      <td>{s?.cls}</td>
                      <td>{f.title}</td>
                      <td>{fmtDate(f.due)}</td>
                      <td className="num">{inr(f.amount)}</td>
                      <td className="num">{inr(f.paid)}</td>
                      <td className="num">{inr(feeBalance(f))}</td>
                      <td>
                        <Pill tone={feeTone(st)}>{feeLabel[st]}</Pill>
                      </td>
                      <td className="r">
                        {st !== "paid" ? (
                          <button type="button" className="btn ghost sm" onClick={() => collect(f.id)}>
                            Record payment
                          </button>
                        ) : (
                          <span className="muted">{fmtDate(f.paidOn)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Nothing in this filter.</Empty>
        )}
      </Panel>
    </>
  );
}
