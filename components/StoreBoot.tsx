"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { bootStore, useStore } from "@/lib/store";

/** Loads the saved demo and keeps `data-palette` on <html> in sync with School settings. */
export function StoreBoot() {
  const palette = useStore((s) => s.db?.school.palette);
  useEffect(() => {
    bootStore();
  }, []);
  useLayoutEffect(() => {
    if (palette) document.documentElement.dataset.palette = palette;
  }, [palette]);
  return null;
}

/** Renders children only once browser data has loaded, so dates and saved state are never server-rendered. */
export function Ready({ children }: { children: ReactNode }) {
  const ready = useStore((s) => s.ready);
  return ready ? children : null;
}
