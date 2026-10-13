"use client";

import type { Mark } from "@/lib/types";
import { MARK_LABEL } from "@/lib/utils";

export function AttendanceToggle({ label, value, onChange }: { label: string; value: Mark; onChange: (v: Mark) => void }) {
  return (
    <div className="mark" role="group" aria-label={label}>
      {(["P", "A", "L"] as const).map((v) => (
        <button key={v} type="button" data-v={v} aria-pressed={value === v} title={MARK_LABEL[v]} onClick={() => onChange(v)}>
          {v}
        </button>
      ))}
    </div>
  );
}
