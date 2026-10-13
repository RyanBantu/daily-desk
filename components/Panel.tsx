import type { CSSProperties, ReactNode } from "react";

export function Panel({
  title,
  right,
  note,
  children,
  style,
  className,
}: {
  title?: ReactNode;
  right?: ReactNode;
  /** full-width line under the title */
  note?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <section className={`panel${className ? " " + className : ""}`} style={style}>
      {title != null || right != null ? (
        <div className="panel-h">
          {typeof title === "string" ? <h3>{title}</h3> : title}
          {right}
          {note ? <p className="muted">{note}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
