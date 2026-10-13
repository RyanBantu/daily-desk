"use client";

import {
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ChartGantt,
  FileText,
  GraduationCap,
  House,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Monitor,
  NotebookText,
  Pencil,
  Settings,
  Sheet,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChild, useMe, useTeacherCtx } from "@/lib/hooks";
import { allClasses, pendingSubmissions, subFor } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { Swatches } from "./Swatches";
import { toast } from "./Toast";

export const PORTAL_LABEL: Record<Role, string> = {
  admin: "Administration",
  teacher: "Teacher portal",
  student: "Student portal",
  parent: "Parent portal",
};

const ICONS: Record<string, LucideIcon> = {
  overview: House,
  classes: LayoutGrid,
  teachers: Users,
  timetable: Sheet,
  exams: NotebookText,
  calendar: CalendarDays,
  settings: Settings,
  attendance: CalendarCheck,
  plan: ChartGantt,
  materials: FileText,
  homework: Pencil,
  marks: ChartColumn,
  students: GraduationCap,
  myclass: Monitor,
  results: ChartColumn,
  notices: Megaphone,
  messages: MessageSquare,
};

export const NAV: Record<Role, [string, string][]> = {
  admin: [["overview", "Overview"], ["classes", "Classes & sections"], ["teachers", "Teachers & subjects"], ["timetable", "Timetables"], ["exams", "Exam schedule"], ["calendar", "Deadlines & notices"], ["settings", "School settings"]],
  teacher: [["overview", "Today"], ["attendance", "Attendance"], ["plan", "Course timeline"], ["materials", "Course material"], ["homework", "Homework"], ["marks", "Exam scores"], ["students", "Performance & remarks"], ["myclass", "My class roster"], ["timetable", "My timetable"]],
  student: [["overview", "Overview"], ["timetable", "Timetable"], ["plan", "Course timeline"], ["materials", "Course material"], ["homework", "Homework"], ["exams", "Exams & results"], ["attendance", "Attendance"], ["notices", "Remarks & notices"]],
  parent: [["overview", "Overview"], ["messages", "Messages"], ["results", "Results & remarks"], ["attendance", "Attendance"], ["calendar", "Exams & deadlines"], ["notices", "School notices"]],
};

export const hrefFor = (role: Role, view: string) => (view === "overview" ? `/${role}` : `/${role}/${view}`);

function useBadges(role: Role): Record<string, number> {
  const db = useDb();
  const { ctxs } = useTeacherCtx();
  const me = useMe();
  const child = useChild();
  if (role === "teacher") return { homework: pendingSubmissions(db, ctxs).length };
  if (role === "student" && me) return { homework: db.homework.filter((h) => h.cls === me.cls && !subFor(db, h.id, me.id)).length };
  if (role === "parent" && child) return { messages: db.messages.filter((m) => m.sid === child.id).length };
  if (role === "admin") return { classes: allClasses(db).filter((c) => !db.classTeacher[c]).length };
  return {};
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const badges = useBadges(role);
  const reset = useStore((s) => s.reset);
  return (
    <aside className="side">
      <nav aria-label={PORTAL_LABEL[role]}>
        <div className="label">{PORTAL_LABEL[role]}</div>
        {NAV[role].map(([id, label]) => {
          const Icon = ICONS[id];
          const href = hrefFor(role, id);
          return (
            <Link key={id} href={href} className="nav-item" aria-current={pathname === href ? "page" : undefined}>
              <Icon strokeWidth={1.7} aria-hidden />
              {label}
              {badges[id] ? <span className="count">{badges[id]}</span> : null}
            </Link>
          );
        })}
        <div className="foot">
          Demo mode. Use the switcher at the top to see each portal. Data is saved in this browser only.
          <div style={{ marginTop: 12 }}>School colours</div>
          <Swatches compact />
          <div style={{ marginTop: 12 }}>
            <ConfirmButton
              className="btn link danger"
              onConfirm={() => {
                reset();
                toast("Sample data restored");
              }}
            >
              Reset demo data
            </ConfirmButton>
          </div>
        </div>
      </nav>
    </aside>
  );
}
