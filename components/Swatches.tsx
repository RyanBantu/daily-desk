"use client";

import { toast } from "./Toast";
import { useDb, useStore } from "@/lib/store";
import { PALETTES } from "@/lib/utils";

export function Swatches({ compact }: { compact?: boolean }) {
  const db = useDb();
  const mutate = useStore((s) => s.mutate);
  const current = db.school.palette || "blue";
  return (
    <div className="swatches" role="group" aria-label="School colours">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          className="swatch"
          aria-pressed={current === p.id}
          title={p.label}
          onClick={() => {
            mutate((d) => {
              d.school.palette = p.id;
            });
            toast(`School colours set to ${p.label}`);
          }}
        >
          <i style={{ background: `linear-gradient(135deg,${p.primary} 55%,${p.accent} 55%)` }} />
          {compact ? null : p.label}
        </button>
      ))}
    </div>
  );
}
