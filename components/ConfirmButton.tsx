"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Two-click confirm: the first click arms the button for 3 seconds, the second runs the action. */
export function ConfirmButton({
  onConfirm,
  className = "btn link danger",
  children,
}: {
  onConfirm: () => void;
  className?: string;
  children: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
    >
      {armed ? "Click again to confirm" : children}
    </button>
  );
}
