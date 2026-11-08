import type { DB, FeeCharge, FeeStatus, PillTone } from "./types";
import { today } from "./utils";

export function feeBalance(f: FeeCharge) {
  return Math.max(0, f.amount - f.paid);
}

export function feeStatus(f: FeeCharge): FeeStatus {
  if (f.paid >= f.amount) return "paid";
  if (f.due < today()) return "overdue";
  if (f.paid > 0) return "partial";
  return "due";
}

export const feeTone = (s: FeeStatus): PillTone =>
  s === "paid" ? "ok" : s === "overdue" ? "bad" : s === "partial" ? "info" : "warn";

export const feeLabel: Record<FeeStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  due: "Due",
  overdue: "Overdue",
};

export const feesFor = (db: DB, sid: string) => db.fees.filter((f) => f.sid === sid).sort((a, b) => a.due.localeCompare(b.due));

export function feeTotals(db: DB, sids?: string[]) {
  const list = sids ? db.fees.filter((f) => sids.includes(f.sid)) : db.fees;
  const billed = list.reduce((n, f) => n + f.amount, 0);
  const collected = list.reduce((n, f) => n + Math.min(f.paid, f.amount), 0);
  const outstanding = billed - collected;
  const overdue = list.filter((f) => feeStatus(f) === "overdue").reduce((n, f) => n + feeBalance(f), 0);
  return { billed, collected, outstanding, overdue, n: list.length };
}
