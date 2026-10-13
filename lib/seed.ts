import { cbse } from "./selectors";
import type { DB, Exam, Mark, Message, Remark, Student, Subject, Teacher, Timetable } from "./types";
import { DAYS, PERIODS, addDays, dayOffset, fmtDateL, nextSchoolDay, pastSchoolDays, uid, weekdayKey } from "./utils";

/** Builds the sample school. Dates are relative to today so the demo always looks current. */
export function seed(): DB {
  let r = 11;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;

  const subjects: Subject[] = [
    { id: "eng", name: "English", code: "ENG" },
    { id: "mat", name: "Mathematics", code: "MAT" },
    { id: "sci", name: "Science", code: "SCI" },
    { id: "phy", name: "Physics", code: "PHY" },
    { id: "csc", name: "Computer Science", code: "CSC" },
    { id: "hin", name: "Hindi", code: "HIN" },
    { id: "sst", name: "Social Studies", code: "SST" },
  ];

  const teachers: Teacher[] = (
    [
      ["t1", "Mr. Arjun Menon", "arjun.menon@westbrook.edu.in", ["csc", "mat"]],
      ["t2", "Ms. Kavya Rao", "kavya.rao@westbrook.edu.in", ["mat"]],
      ["t3", "Mr. David Thomas", "david.thomas@westbrook.edu.in", ["phy", "sci"]],
      ["t4", "Mrs. Leena Fernandes", "leena.fernandes@westbrook.edu.in", ["eng"]],
      ["t5", "Mrs. Priya Sharma", "priya.sharma@westbrook.edu.in", ["hin"]],
      ["t6", "Mr. Rahul Verma", "rahul.verma@westbrook.edu.in", ["sst"]],
      ["t7", "Ms. Anita George", "anita.george@westbrook.edu.in", ["sci"]],
      ["t8", "Mr. Farhan Ali", "farhan.ali@westbrook.edu.in", ["csc"]],
    ] as [string, string, string, string[]][]
  ).map(([id, name, email, subjects]) => ({ id, name, email, subjects }));

  const sections: Record<number, number> = { 3: 2, 4: 2, 5: 2, 6: 3, 7: 3, 8: 3, 9: 2, 10: 2 };

  const pattern: Record<string, string[]> = {
    Mon: ["eng", "mat", "phy", "csc", "hin", "sst"],
    Tue: ["mat", "eng", "csc", "phy", "sst", "hin"],
    Wed: ["phy", "mat", "eng", "sst", "csc", "hin"],
    Thu: ["csc", "phy", "mat", "eng", "hin", "sst"],
    Fri: ["mat", "csc", "eng", "phy", "sst", "hin"],
  };
  const staff: Record<string, Record<string, string>> = {
    "10-A": { eng: "t4", mat: "t2", phy: "t3", csc: "t1", hin: "t5", sst: "t6" },
    "10-B": { eng: "t4", mat: "t1", phy: "t3", csc: "t8", hin: "t5", sst: "t6" },
  };
  const timetable: Timetable = { "10-A": {}, "10-B": {} };
  DAYS.forEach((d) =>
    pattern[d].forEach((s, i) => {
      timetable["10-A"][`${d}-${i + 1}`] = { subject: s, teacher: staff["10-A"][s] };
      const sb = pattern[d][(i + 1) % 6];
      timetable["10-B"][`${d}-${i + 1}`] = { subject: sb, teacher: staff["10-B"][sb] };
    }),
  );

  const fam: [string, string, string][] = [
    ["10-A", "Amn Shetty", "Rakesh Shetty"],
    ["10-A", "Jane D'Souza", "Maria D'Souza"],
    ["10-A", "Pete Mathew", "Thomas Mathew"],
    ["10-A", "Riya Kulkarni", "Sunil Kulkarni"],
    ["10-A", "Karthik Iyer", "Lakshmi Iyer"],
    ["10-A", "Sana Qureshi", "Imran Qureshi"],
    ["10-A", "Dev Nair", "Anil Nair"],
    ["10-A", "Meera Joshi", "Neha Joshi"],
    ["10-B", "Aditya Rao", "Suresh Rao"],
    ["10-B", "Fatima Khan", "Ayesha Khan"],
    ["10-B", "Rohan Das", "Bikash Das"],
    ["10-B", "Sneha Pillai", "Gopal Pillai"],
    ["10-B", "Vikram Singh", "Harpreet Singh"],
  ];
  const students: Student[] = fam.map(([cls, name, parent], i) => ({
    id: "s" + (i + 1),
    cls,
    name,
    parent,
    phone: "+91 98" + String(45012300 + i * 7311).slice(0, 8),
  }));

  const attendance: DB["attendance"] = {};
  pastSchoolDays(12).forEach((date) => {
    const wd = weekdayKey(date);
    ["10-A", "10-B"].forEach((cls) => {
      const subs = [
        ...new Set(PERIODS.map((_, i) => timetable[cls][`${wd}-${i + 1}`]?.subject).filter(Boolean)),
      ] as string[];
      subs.forEach((sub) => {
        const rec: Record<string, Mark> = {};
        students
          .filter((s) => s.cls === cls)
          .forEach((s) => {
            const x = rnd();
            rec[s.id] =
              s.name === "Dev Nair" ? (x < 0.4 ? "A" : x < 0.45 ? "L" : "P") : x < 0.06 ? "A" : x < 0.1 ? "L" : "P";
          });
        attendance[`${cls}|${sub}|${date}`] = rec;
      });
    });
  });

  const exams: Exam[] = [];
  const marks: DB["marks"] = {};
  const ut = ["eng", "mat", "phy", "csc", "hin", "sst"];
  let d = nextSchoolDay(dayOffset(-24));
  ut.forEach((sub) => {
    const id = uid();
    exams.push({ id, grade: 10, cls: null, name: "Unit Test 2", subject: sub, date: d, time: "09:00", max: 25 });
    marks[id] = {};
    students.forEach((s) => (marks[id][s.id] = Math.round(11 + rnd() * 14)));
    d = nextSchoolDay(addDays(d, 1));
  });
  exams.forEach((e) => (e.sent = e.subject === "csc" || e.subject === "eng"));
  d = nextSchoolDay(dayOffset(16));
  ut.forEach((sub) => {
    exams.push({ id: uid(), grade: 10, cls: null, name: "Term 1 Examination", subject: sub, date: d, time: "09:00", max: 80 });
    d = nextSchoolDay(addDays(d, 1));
  });
  d = nextSchoolDay(dayOffset(17));
  ["eng", "mat", "sci", "hin", "sst"].forEach((sub) => {
    exams.push({ id: uid(), grade: 9, cls: null, name: "Term 1 Examination", subject: sub, date: d, time: "09:00", max: 80 });
    d = nextSchoolDay(addDays(d, 1));
  });
  const ctId = uid();
  exams.push({
    id: ctId,
    grade: 10,
    cls: "10-A",
    name: "Class test: Selection statements",
    subject: "csc",
    date: nextSchoolDay(dayOffset(-6)),
    time: "08:45",
    max: 20,
  });
  marks[ctId] = {};
  students.filter((s) => s.cls === "10-A").forEach((s) => (marks[ctId][s.id] = Math.round(9 + rnd() * 11)));

  const h1 = uid(), h2 = uid(), h3 = uid();
  const remarks: Remark[] = [
    { id: uid(), sid: "s3", tid: "t4", subject: "eng", level: "Needs improvement", text: "Pete has missed two reading assignments this month. Please make sure he finishes Chapter 5 of the novel by Friday.", date: dayOffset(-3), shared: true },
    { id: uid(), sid: "s2", tid: "t1", subject: "csc", level: "Excellent", text: "Jane wrote clean, well-commented programs for the selection unit and helped classmates debug theirs.", date: dayOffset(-2), shared: false },
    { id: uid(), sid: "s7", tid: "t4", subject: "eng", level: "Satisfactory", text: "Dev participates well in class discussions but his attendance has dropped below 75%. Regular attendance will help before Term 1.", date: dayOffset(-1), shared: true },
  ];

  const messages: Message[] = [];
  remarks
    .filter((x) => x.shared)
    .forEach((x) =>
      messages.push({ id: uid(), sid: x.sid, tid: x.tid, subject: x.subject, kind: "Remark", title: `${x.level} — remark from class`, body: x.text, date: x.date }),
    );
  exams
    .filter((e) => e.sent)
    .forEach((e) =>
      students.forEach((s) => {
        const m = marks[e.id][s.id];
        messages.push({
          id: uid(),
          sid: s.id,
          tid: staff[s.cls][e.subject],
          subject: e.subject,
          kind: "Exam score",
          title: `${e.name}: ${m} / ${e.max}`,
          body: `${s.name.split(" ")[0]} scored ${m} out of ${e.max} (${Math.round((m / e.max) * 100)}%, grade ${cbse((m / e.max) * 100)}) in ${e.name}.`,
          date: addDays(e.date, 4),
        });
      }),
    );

  let r1 = 7;
  const rnd1 = () => (r1 = (r1 * 9301 + 49297) % 233280) / 233280;
  d = nextSchoolDay(dayOffset(-52));
  ut.forEach((sub) => {
    const id = uid();
    exams.push({ id, grade: 10, cls: null, name: "Unit Test 1", subject: sub, date: d, time: "09:00", max: 25, sent: true });
    marks[id] = {};
    students.forEach((s) => (marks[id][s.id] = Math.round(10 + rnd1() * 14)));
    d = nextSchoolDay(addDays(d, 1));
  });

  const unit = (cls: string, subject: string) => ([title, a, b]: [string, number, number]) => ({
    id: uid(),
    cls,
    subject,
    title,
    start: dayOffset(a),
    end: dayOffset(b),
  });

  return {
    school: { name: "Westbrook Public School", year: "2026–27", board: "CBSE", palette: "blue" },
    subjects,
    teachers,
    sections,
    classTeacher: { "10-A": "t4", "10-B": "t2", "9-A": "t1", "8-A": "t6", "7-B": "t7" },
    timetable,
    students,
    attendance,
    exams,
    marks,
    remarks,
    messages,
    deadlines: [
      { id: uid(), scope: "all", title: "Term 1 fee payment closes", date: dayOffset(4), by: "admin" },
      { id: uid(), scope: "g10", title: "Science exhibition entries due", date: dayOffset(6), by: "admin" },
      { id: uid(), scope: "g9", title: "Practical record books to be submitted", date: dayOffset(10), by: "admin" },
      { id: uid(), scope: "10-A", subject: "csc", title: "Project: Java mini calculator", date: dayOffset(9), by: "t1" },
      { id: uid(), scope: "10-A", subject: "mat", title: "Maths lab manual submission", date: dayOffset(5), by: "t2" },
    ],
    notices: [
      { id: uid(), title: `CBSE affiliation inspection on ${fmtDateL(nextSchoolDay(dayOffset(3)))}`, category: "Inspection", scope: "all", date: dayOffset(-1), body: "An inspection team will visit classrooms and labs. Students must be in full uniform with ID cards. Practical record books should be up to date and available on desks." },
      { id: uid(), title: "Parent–teacher meeting for Class 10", category: "Event", scope: "g10", date: dayOffset(-2), body: "Saturday, 9:00 AM to 12:30 PM. Term 1 preparation and Unit Test 2 results will be discussed with each class teacher." },
      { id: uid(), title: "Term 1 examination schedule published", category: "Exam", scope: "all", date: dayOffset(-4), body: "The datesheet for Classes 9 and 10 is now available under Exams. Other classes will be published next week." },
    ],
    plan: [
      ...([["Ch 3 · Data types and operators", -34, -17], ["Ch 4 · Selection: if, else-if, switch", -16, 3], ["Ch 5 · Iteration: for, while, do-while", 4, 18], ["Ch 6 · Arrays", 19, 36]] as [string, number, number][]).map(unit("10-A", "csc")),
      ...([["Quadratic equations", -26, -4], ["Arithmetic progressions", -3, 11], ["Triangles and similarity", 12, 30]] as [string, number, number][]).map(unit("10-A", "mat")),
      ...([["Light: reflection and refraction", -28, -6], ["The human eye", -5, 8], ["Electricity", 9, 32]] as [string, number, number][]).map(unit("10-A", "phy")),
      ...([["First Flight: Ch 4–6", -20, 0], ["Writing: formal letters", 1, 10], ["Footprints: Ch 3–5", 11, 28]] as [string, number, number][]).map(unit("10-A", "eng")),
    ],
    materials: [
      { id: uid(), cls: "10-A", subject: "csc", title: "Java — if, else-if and nested if", text: "A condition must evaluate to a boolean. Use == for comparison, not =.\nWork through examples 4.1 to 4.6 from class before Thursday.", file: { name: "Selection statements.pdf", size: 182000 }, date: dayOffset(-1) },
      { id: uid(), cls: "10-A", subject: "mat", title: "Arithmetic progressions: nth term", text: "aₙ = a + (n − 1)d\nIdentify a and d first, then substitute. Check your answer by listing the first few terms.", file: null, date: dayOffset(-2) },
      { id: uid(), cls: "10-A", subject: "phy", title: "The human eye: defects of vision", text: "Myopia is corrected with a concave lens, hypermetropia with a convex lens.\nRevise ray diagrams 11.2 and 11.3.", file: { name: "Eye defects worksheet.docx", size: 54000 }, date: dayOffset(-3) },
    ],
    homework: [
      { id: h1, cls: "10-A", subject: "csc", title: "Java if-else practice", instructions: "Write 3 programs using if-else-if: grade calculator, leap year check, largest of three numbers.", due: dayOffset(2), created: dayOffset(-1) },
      { id: h2, cls: "10-A", subject: "mat", title: "Exercise 5.2, Q1–12", instructions: "Find the nth term for each AP. Show a and d clearly.", due: dayOffset(1), created: dayOffset(-2) },
      { id: h3, cls: "10-A", subject: "phy", title: "Human eye ray diagrams", instructions: "Draw labelled ray diagrams for myopia and hypermetropia, before and after correction.", due: dayOffset(-1), created: dayOffset(-4) },
    ],
    submissions: [
      { id: uid(), hw: h1, sid: "s2", file: { name: "IfElse_Jane.zip", size: 12400 }, comment: "Added a bonus program for even/odd.", time: new Date(Date.now() - 18e6).toISOString(), status: "pending", score: null, remark: "", shared: false },
      { id: uid(), hw: h1, sid: "s4", file: { name: "notebook_photo.jpg", size: 845000 }, comment: "", time: new Date(Date.now() - 72e6).toISOString(), status: "reviewed", score: 9, remark: "Neat work. Watch your indentation in program 3.", shared: true },
      { id: uid(), hw: h3, sid: "s1", file: { name: "EyeDiagrams_Amn.pdf", size: 310000 }, comment: "", time: new Date(Date.now() - 108e6).toISOString(), status: "pending", score: null, remark: "", shared: false },
    ],
  };
}
