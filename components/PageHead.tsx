import type { ReactNode } from "react";

export function PageHead({ eyebrow, title, sub, right }: { eyebrow: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}
