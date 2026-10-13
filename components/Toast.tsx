"use client";

import { useEffect } from "react";
import { create } from "zustand";

const useToast = create<{ msg: string; on: boolean; n: number }>(() => ({ msg: "", on: false, n: 0 }));

export function toast(msg: string) {
  useToast.setState((s) => ({ msg, on: true, n: s.n + 1 }));
}

export function Toast() {
  const { msg, on, n } = useToast();
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => useToast.setState({ on: false }), 2800);
    return () => clearTimeout(t);
  }, [on, n]);
  return (
    <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">
      {msg}
    </div>
  );
}
