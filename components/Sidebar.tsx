"use client";

import {
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ChartGantt,
  ClipboardList,
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
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { feeStatus } from "@/lib/fees";
import { useChild, useMe, useTeacherCtx } from "@/lib/hooks";
import { allClasses, pendingSubmissions, subFor } from "@/lib/selectors";
import { useDb, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { Swatches } from "./Swatches";
import { toast } from "./Toast";

export const PORTAL_LABEL: Record<Role, string> = {
  admin: "Whole-school overview",
  teacher: "Teacher workspace",
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
  fees: Wallet,
  reports: ClipboardList,
  progress: TrendingUp,
};

export type NavGroup = { label: string; items: [string, string][] };

export const NAV: Record<Role, NavGroup[]> = {
  admin: [
    {
      label: "School operations",
      items: [
        ["overview", "Overview"],
        ["classes", "Classes"],
        ["timetable", "Timetables"],
        ["settings", "Settings"],
      ],
    },
    {
      label: "Staff & student records",
      items: [
        ["teachers", "Staff"],
        ["students", "Students"],
      ],
    },
    {
      label: "Attendance, exams & results",
      items: [
        ["attendance", "Attendance"],
        ["exams", "Exams & results"],
      ],
    },
    {
      label: "Fees, reports & announcements",
      items: [
        ["fees", "Fees"],
        ["reports", "Reports"],
        ["calendar", "Announcements"],
      ],
    },
  ],
  teacher: [
    {
      label: "Homeroom",
      items: [
        ["overview", "Today"],
        ["myclass", "Class register"],
      ],
    },
    {
      label: "Classes and subjects taught",
      items: [
        ["timetable", "My timetable"],
        ["plan", "Course plan"],
        ["materials", "Materials"],
      ],
    },
    {
      label: "Attendance & assignments",
      items: [
        ["attendance", "Attendance"],
        ["homework", "Assignments"],
      ],
    },
    {
      label: "Marks, feedback & progress",
      items: [
        ["marks", "Marks"],
        ["students", "Feedback & progress"],
      ],
    },
  ],
  student: [
    {
      label: "My school",
      items: [
        ["overview", "Overview"],
        ["timetable", "Subjects & timetable"],
      ],
    },
    {
      label: "Assignments",
      items: [
        ["homework", "Assignments"],
        ["materials", "Materials"],
        ["plan", "Course plan"],
      ],
    },
    {
      label: "Marks & progress",
      items: [
        ["exams", "Marks & feedback"],
        ["progress", "My progress"],
        ["attendance", "Attendance"],
        ["notices", "Updates"],
      ],
    },
  ],
  parent: [
    {
      label: "Linked ward",
      items: [
        ["overview", "Performance"],
        ["results", "Subject marks"],
        ["attendance", "Attendance"],
      ],
    },
    {
      label: "Assignments & progress",
      items: [
        ["homework", "Assignments"],
        ["progress", "Progress"],
      ],
    },
    {
      label: "Teacher / school updates",
      items: [
        ["messages", "Teacher updates"],
        ["notices", "School updates"],
        ["calendar", "Dates"],
        ["fees", "Fees"],
      ],
    },
  ],
};

export const hrefFor = (role: Role, view: string) => (view === "overview" ? `/${role}` : `/${role}/${view}`);

function useBadges(role: Role): Record<string, number> {
  const db = useDb();
  const { ctxs } = useTeacherCtx();
  const me = useMe();
  const child = useChild();
  if (role === "teacher") return { homework: pendingSubmissions(db, ctxs).length };
  if (role === "student" && me) return { homework: db.homework.filter((h) => h.cls === me.cls && !subFor(db, h.id, me.id)).length };
  if (role === "parent" && child) {
    const dueHw = db.homework.filter((h) => h.cls === child.cls && !subFor(db, h.id, child.id)).length;
    return {
      messages: db.messages.filter((m) => m.sid === child.id).length,
      homework: dueHw,
      fees: db.fees.filter((f) => f.sid === child.id && feeStatus(f) !== "paid").length,
    };
  }
  if (role === "admin")
    return {
      classes: allClasses(db).filter((c) => !db.classTeacher[c]).length,
      fees: db.fees.filter((f) => feeStatus(f) === "overdue").length,
    };
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
        {NAV[role].map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map(([id, label]) => {
              const Icon = ICONS[id];
              const href = hrefFor(role, id);
              return (
                <Link key={id} href={href} className="nav-item" aria-current={pathname === href ? "page" : undefined}>
                  {Icon ? <Icon strokeWidth={1.7} aria-hidden /> : null}
                  {label}
                  {badges[id] ? <span className="count">{badges[id]}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
        <div className="foot">
          <p>
            <b>Access control.</b> Each role sees only the information permitted for that account. Parents can view only
            their linked ward(s); students see only their own records.
          </p>
          <p style={{ marginTop: 10 }}>Demo mode. The switcher at the top opens another role’s login. Data stays in this browser.</p>
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
