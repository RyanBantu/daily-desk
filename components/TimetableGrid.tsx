"use client";

import type { ReactNode } from "react";
import type { Day } from "@/lib/types";
import { DAYS, PERIODS, today, weekdayKey } from "@/lib/utils";

export function TimetableGrid({
  cell,
  markToday,
}: {
  cell: (day: Day, period: number, isToday: boolean) => ReactNode;
  markToday?: boolean;
}) {
  const td = weekdayKey(today());
  return (
    <div className="scroll">
      <table className="tt">
        <thead>
          <tr>
            <th />
            {PERIODS.map((p, i) => (
              <th key={i}>
                Period {i + 1}
                <small>
                  {p[0]}–{p[1]}
                </small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((d) => (
            <tr key={d}>
              <td className="day">{d}</td>
              {PERIODS.map((_, i) => (
                <td key={i}>{cell(d, i + 1, !!markToday && d === td)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Slot({ title, sub, today: isToday }: { title: ReactNode; sub: ReactNode; today?: boolean }) {
  return (
    <div className={`slot filled${isToday ? " today" : ""}`}>
      <b>{title}</b>
      <span>{sub}</span>
    </div>
  );
}

export function EmptySlot({ label }: { label: string }) {
  return <div className="slot empty-s">{label}</div>;
}
