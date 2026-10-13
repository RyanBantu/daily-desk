"use client";

import { useRouter } from "next/navigation";
import { ROLES } from "@/lib/session";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const LABEL: Record<Role, string> = { admin: "Admin", teacher: "Teacher", student: "Student", parent: "Parent" };

export function RoleSwitch({ role }: { role: Role }) {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);
  return (
    <div className="seg" role="group" aria-label="Portal">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={role === r}
          onClick={() => {
            if (r === role) return;
            signIn(r);
            router.push(`/${r}`);
          }}
        >
          {LABEL[r]}
        </button>
      ))}
    </div>
  );
}
