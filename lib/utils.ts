import type { Day, FileMeta, Level, NoticeCategory, PaletteId } from "./types";

export const GRADES = [3, 4, 5, 6, 7, 8, 9, 10];
export const LETTERS = "ABCDEFGH";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const PERIODS: [string, string][] = [
  ["08:00", "08:45"],
  ["08:45", "09:30"],
  ["09:45", "10:30"],
  ["10:30", "11:15"],
  ["11:45", "12:30"],
  ["12:30", "13:15"],
];
export const LEVELS: Level[] = ["Excellent", "Good", "Satisfactory", "Needs improvement"];
export const NOTICE_CATS: NoticeCategory[] = ["General", "Inspection", "Exam", "Event", "Holiday"];
export const PALETTES: { id: PaletteId; label: string; primary: string; accent: string }[] = [
  { id: "blue", label: "Blue & yellow", primary: "#1F5BC6", accent: "#F5B800" },
  { id: "navy", label: "Navy & gold", primary: "#1D4F91", accent: "#F5B800" },
  { id: "teal", label: "Teal & amber", primary: "#0E6B67", accent: "#F2A900" },
  { id: "maroon", label: "Maroon & gold", primary: "#8C1D40", accent: "#E0A419" },
  { id: "forest", label: "Forest & gold", primary: "#2F6B2F", accent: "#E3A92B" },
  { id: "graphite", label: "Graphite & orange", primary: "#2F3640", accent: "#F28C28" },
];
export const EXAM_NAMES = ["Unit Test 1", "Unit Test 2", "Term 1 Examination", "Pre-board", "Annual Examination"];
export const MARK_LABEL = { P: "Present", A: "Absent", L: "Late" } as const;

export const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => iso(new Date());
const parse = (s: string) => new Date(s + "T00:00");
export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const dayOffset = (n: number) => addDays(today(), n);
export const diffDays = (a: string, b: string) => Math.round((parse(a).getTime() - parse(b).getTime()) / 864e5);
export const isWeekend = (s: string) => {
  const g = parse(s).getDay();
  return g === 0 || g === 6;
};
export const nextSchoolDay = (s: string) => {
  let d = s;
  while (isWeekend(d)) d = addDays(d, 1);
  return d;
};
export const pastSchoolDays = (n: number) => {
  const out: string[] = [];
  let d = today();
  while (out.length < n) {
    d = addDays(d, -1);
    if (!isWeekend(d)) out.push(d);
  }
  return out.reverse();
};
export const weekdayKey = (s: string): Day | null => {
  const g = parse(s).getDay();
  return g >= 1 && g <= 5 ? DAYS[g - 1] : null;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtSize = (b: number) =>
  b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
export const fmtDate = (s?: string | null) =>
  s ? parse(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";
export const fmtDateL = (s?: string | null) =>
  s ? parse(s).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "—";
export const fmtTime = (t?: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
};
export const fmtStamp = (isoTime: string) =>
  new Date(isoTime).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const TITLE = /^(mr|ms|mrs|dr)\.?$/i;
export const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter((w) => w && !TITLE.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const shortName = (n: string) => {
  const p = n.split(" ").filter((w) => !TITLE.test(w));
  return p.length > 1 ? p[0][0] + ". " + p.slice(1).join(" ") : n;
};
export const firstName = (n: string) => n.split(" ")[0];
export const crestInitials = (schoolName: string) =>
  initials(schoolName.replace(/school|public/gi, "").trim() || schoolName);

export function readFile(f: File): Promise<FileMeta> {
  return new Promise((res) => {
    const meta: FileMeta = { name: f.name, size: f.size, type: f.type };
    if (f.type.startsWith("image/") && f.size < 600000) {
      const r = new FileReader();
      r.onload = () => res({ ...meta, data: String(r.result) });
      r.onerror = () => res(meta);
      r.readAsDataURL(f);
    } else res(meta);
  });
}

/** Reads a submitted form; `g` returns a trimmed string field. */
export function formValues(form: HTMLFormElement) {
  const fd = new FormData(form);
  return { fd, g: (k: string) => String(fd.get(k) ?? "").trim() };
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
