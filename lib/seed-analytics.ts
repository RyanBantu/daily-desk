import type { DB } from "./types";
import { addDays, nextSchoolDay, today } from "./analytics";

let r = 7;
const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
const uid = () => Math.random().toString(36).slice(2, 10);

const ROUNDS: [name: string, daysAgo: number, max: number][] = [
  ["Periodic Test 1", -80, 20],
  ["Unit Test 1", -52, 25],
  ["Unit Test 2", -24, 25],
];

/** Adds 3 test rounds with consistent per-student ability, and realistic homework submissions. */
export function enrichSeed(data: DB): DB {
  r = 7;
  const subjects = ["eng", "mat", "phy", "csc", "hin", "sst"];
  const grade10 = data.students.filter((s) => s.cls.startsWith("10-"));

  const roundNames = ROUNDS.map((x) => x[0]);
  const drop = new Set(data.exams.filter((e) => e.grade === 10 && !e.cls && roundNames.includes(e.name)).map((e) => e.id));
  data.exams = data.exams.filter((e) => !drop.has(e.id));
  drop.forEach((id) => delete data.marks[id]);

  const ability: Record<string, number> = {};
  const growth: Record<string, number> = {};
  const bias: Record<string, Record<string, number>> = {};
  grade10.forEach((s) => {
    ability[s.id] =
      s.name === "Dev Nair" ? 0.47 : s.name === "Pete Mathew" ? 0.58 : s.name === "Rohan Das" ? 0.55 : 0.62 + rnd() * 0.3;
    growth[s.id] = s.name === "Pete Mathew" ? -0.05 : (rnd() - 0.35) * 0.08;
    bias[s.id] = Object.fromEntries(subjects.map((x) => [x, (rnd() - 0.5) * 0.18]));
  });

  ROUNDS.forEach(([name, off, max], ri) => {
    let d = nextSchoolDay(addDays(today(), off));
    subjects.forEach((sub) => {
      const id = uid();
      data.exams.push({ id, grade: 10, cls: null, name, subject: sub, date: d, time: "09:00", max });
      data.marks[id] = {};
      grade10.forEach((s) => {
        const q = Math.min(0.98, Math.max(0.22, ability[s.id] + bias[s.id][sub] + growth[s.id] * ri + (rnd() - 0.5) * 0.1));
        data.marks[id][s.id] = Math.round(q * max * 2) / 2;
      });
      d = nextSchoolDay(addDays(d, 1));
    });
  });

  const sorted = [...data.homework].sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
  sorted.forEach((h, i) => {
    const rate = i === 0 ? 0.9 : i === sorted.length - 1 ? 0.35 : 0.6;
    data.students
      .filter((s) => s.cls === h.cls)
      .forEach((s) => {
        if (data.submissions.some((x) => x.hw === h.id && x.sid === s.id)) return;
        if (s.name === "Pete Mathew" || (s.name === "Dev Nair" && rnd() < 0.8) || rnd() >= rate) return;
        const past = !!h.due && h.due < today();
        data.submissions.push({
          id: uid(),
          hw: h.id,
          sid: s.id,
          file: { name: `${h.title.split(/[ :]/)[0]}_${s.name.split(" ")[0]}.pdf`, size: Math.round(80000 + rnd() * 400000) },
          comment: "",
          time: new Date(Date.now() - (1 + rnd() * 3) * 864e5).toISOString(),
          status: past ? "reviewed" : "pending",
          score: past ? Math.round((6 + rnd() * 4) * 2) / 2 : null,
          remark: past ? "Checked. Neat and complete." : "",
          shared: false,
        });
      });
  });

  return data;
}
