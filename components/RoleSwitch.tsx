"use client";

import { useRouter } from "next/navigation";
import { ROLE_LABEL } from "@/lib/demo-auth";
import { ROLES } from "@/lib/session";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export function RoleSwitch({ role }: { role: Role }) {
  const router = useRouter();
  const signOut = useStore((s) => s.signOut);

  function go(r: Role) {
    if (r === role) return;
    signOut();
    router.push(`/login?role=${r}`);
  }

  return (
    <div className="seg" role="group" aria-label="Switch portal">
      {ROLES.map((r) => (
        <button key={r} type="button" aria-pressed={r === role} onClick={() => go(r)}>
          {ROLE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}
