import type { ReactNode } from "react";

export function SubjectCode({ children }: { children: ReactNode }) {
  return <span className="code">{children}</span>;
}
