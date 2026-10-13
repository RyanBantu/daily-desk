"use client";

import { useEffect } from "react";
import { create } from "zustand";

const usePreview = create<{ src: string | null }>(() => ({ src: null }));
export const openPreview = (src: string) => usePreview.setState({ src });
const close = () => usePreview.setState({ src: null });

export function ImagePreview() {
  const src = usePreview((s) => s.src);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  if (!src) return null;
  return (
    <button type="button" className="modal" onClick={close} aria-label="Close preview">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Attachment preview" />
    </button>
  );
}
