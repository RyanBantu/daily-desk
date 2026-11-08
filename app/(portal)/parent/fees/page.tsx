"use client";

import { KpiRow } from "@/components/kpi-row";
import { Empty, Panel } from "@/components/Panel";
import { Pill } from "@/components/Pill";
import { ParentHead } from "@/components/StudentHead";
import { feeBalance, feeLabel, feeStatus, feeTone, feeTotals, feesFor } from "@/lib/fees";
import { useChild } from "@/lib/hooks";
import { useDb } from "@/lib/store";
import { firstName, fmtDate, inr } from "@/lib/utils";

export default function ParentFees() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  const rows = feesFor(db, c.id);
  const totals = feeTotals(db, [c.id]);

  return (
    <>
      <ParentHead title="Fees" sub={`Charges billed to ${firstName(c.name)}. Other children on this account have their own balances.`} />
      <KpiRow
        items={[
          { label: "Billed", value: inr(totals.billed), caption: `${rows.length} fee lines` },
          { label: "Paid", value: inr(totals.collected), caption: totals.billed ? `${Math.round((totals.collected / totals.billed) * 100)}% settled` : "No bills" },
          { label: "Outstanding", value: inr(totals.outstanding), caption: "Still to pay" },
          { label: "Overdue", value: inr(totals.overdue), caption: "Past the due date" },
        ]}
      />
      <Panel>
        {rows.length ? (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Head</th>
                  <th>Due</th>
                  <th className="r">Amount</th>
                  <th className="r">Paid</th>
                  <th className="r">Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const st = feeStatus(f);
                  return (
                    <tr key={f.id}>
                      <td>
                        <b>{f.title}</b>
                      </td>
                      <td>{fmtDate(f.due)}</td>
                      <td className="num">{inr(f.amount)}</td>
                      <td className="num">{inr(f.paid)}</td>
                      <td className="num">{inr(feeBalance(f))}</td>
                      <td>
                        <Pill tone={feeTone(st)}>{feeLabel[st]}</Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No fee lines for this student.</Empty>
        )}
      </Panel>
    </>
  );
}
