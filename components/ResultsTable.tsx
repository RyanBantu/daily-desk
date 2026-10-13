"use client";

import { cbse, results, subj } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { Empty } from "./Panel";

export function ResultsTable({ sid }: { sid: string }) {
  const db = useDb();
  const r = results(db, sid);
  if (!r.length) return <Empty>No marks have been published yet.</Empty>;
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>Exam</th>
            <th>Subject</th>
            <th>Date</th>
            <th className="r">Marks</th>
            <th className="r">%</th>
            <th className="r">Grade</th>
          </tr>
        </thead>
        <tbody>
          {r
            .sort((a, b) => b.e.date.localeCompare(a.e.date))
            .map(({ e, m, pct }) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{subj(db, e.subject).name}</td>
                <td className="mono">{fmtDate(e.date)}</td>
                <td className="num">
                  {m} / {e.max}
                </td>
                <td className="num">{pct}</td>
                <td className="num">
                  <b>{cbse(pct)}</b>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
