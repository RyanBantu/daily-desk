"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isRole } from "@/lib/session";
import { useDb, useStore } from "@/lib/store";
import { Header } from "./Header";
import { Empty } from "./Panel";
import { Sidebar } from "./Sidebar";
import { Ready } from "./StoreBoot";

function Shell({ children }: { children: ReactNode }) {
  const db = useDb();
  const area = usePathname().split("/")[1];
  const role = isRole(area) ? area : "admin";
  const sessionRole = useStore((s) => s.session?.role);
  const signIn = useStore((s) => s.signIn);
  useEffect(() => {
    if (sessionRole !== role) signIn(role);
  }, [role, sessionRole, signIn]);
  let body = children;
  if ((role === "student" || role === "parent") && !db.students.length)
    body = <Empty>No students have been added yet. Class teachers add them from the Teacher portal.</Empty>;
  else if (role === "teacher" && !db.teachers.length) body = <Empty>No teachers yet. Add staff from the Admin portal.</Empty>;
  return (
    <>
      <Header role={role} />
      <div className="shell">
        <Sidebar role={role} />
        <main className="main">{body}</main>
      </div>
    </>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <Ready>
      <Shell>{children}</Shell>
    </Ready>
  );
}
