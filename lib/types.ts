export type Role = "admin" | "teacher" | "student" | "parent";
export type Mark = "P" | "A" | "L";
export type Level = "Excellent" | "Good" | "Satisfactory" | "Needs improvement";
export type NoticeCategory = "General" | "Inspection" | "Exam" | "Event" | "Holiday";
export type PaletteId = "blue" | "navy" | "teal" | "maroon" | "forest" | "graphite";
export type PillTone = "ok" | "bad" | "warn" | "info" | "mute";
export type MessageKind = "Remark" | "Exam score" | "Homework";
export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

/** "all" | "g10" (every section of a grade) | "10-A" (one section) */
export type Scope = string;

export interface Session {
  role: Role;
  userId: string;
}

export interface School {
  name: string;
  year: string;
  board: string;
  palette: PaletteId;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[];
}

export interface Slot {
  subject: string;
  teacher: string;
}

/** Keyed by section ("10-A"), then by "Mon-1". */
export type Timetable = Record<string, Record<string, Slot>>;

export interface Student {
  id: string;
  cls: string;
  name: string;
  parent: string;
  phone: string;
}

export interface Exam {
  id: string;
  grade: number;
  /** null means every section of the grade */
  cls: string | null;
  name: string;
  subject: string;
  date: string;
  time: string;
  max: number;
  sent?: boolean;
}

export interface Remark {
  id: string;
  sid: string;
  tid: string;
  subject: string;
  level: Level;
  text: string;
  date: string;
  shared: boolean;
}

export interface Message {
  id: string;
  sid: string;
  tid: string;
  subject: string;
  kind: MessageKind;
  title: string;
  body: string;
  date: string;
}

export interface Deadline {
  id: string;
  scope: Scope;
  title: string;
  date: string;
  /** "admin" or a teacher id */
  by: string;
  subject?: string;
}

export interface Notice {
  id: string;
  title: string;
  category: NoticeCategory;
  scope: Scope;
  date: string;
  body: string;
}

export interface Unit {
  id: string;
  cls: string;
  subject: string;
  title: string;
  start: string;
  end: string;
}

export interface FileMeta {
  name: string;
  size: number;
  type?: string;
  /** data URL, only for images under 600 KB */
  data?: string;
}

export interface Material {
  id: string;
  cls: string;
  subject: string;
  title: string;
  text: string;
  file: FileMeta | null;
  date: string;
}

export interface Homework {
  id: string;
  cls: string;
  subject: string;
  title: string;
  instructions: string;
  due: string;
  created: string;
}

export interface Submission {
  id: string;
  hw: string;
  sid: string;
  file: FileMeta;
  comment: string;
  time: string;
  status: "pending" | "reviewed";
  score: number | null;
  remark: string;
  shared: boolean;
}

export interface DB {
  school: School;
  subjects: Subject[];
  teachers: Teacher[];
  /** grade → number of sections */
  sections: Record<number, number>;
  /** section → teacher id */
  classTeacher: Record<string, string>;
  timetable: Timetable;
  students: Student[];
  /** "10-A|csc|2026-10-13" → student id → mark */
  attendance: Record<string, Record<string, Mark>>;
  exams: Exam[];
  /** exam id → student id → marks */
  marks: Record<string, Record<string, number>>;
  remarks: Remark[];
  messages: Message[];
  deadlines: Deadline[];
  notices: Notice[];
  plan: Unit[];
  materials: Material[];
  homework: Homework[];
  submissions: Submission[];
}
