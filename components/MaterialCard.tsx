"use client";

import { Paperclip } from "lucide-react";
import { shortNameOf, subj, subjTeacher } from "@/lib/selectors";
import { useDb } from "@/lib/store";
import type { FileMeta, Material } from "@/lib/types";
import { fmtDateL, fmtSize } from "@/lib/utils";
import { ConfirmButton } from "./ConfirmButton";
import { openPreview } from "./ImagePreview";
import { SubjectCode } from "./SubjectCode";

export function Thumb({ file, style }: { file: FileMeta; style?: React.CSSProperties }) {
  if (!file.data) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="thumb" style={style} src={file.data} alt={file.name} onClick={() => openPreview(file.data!)} />
  );
}

export function MaterialCard({ m, onRemove }: { m: Material; onRemove?: () => void }) {
  const db = useDb();
  return (
    <article className="mat">
      <div className="meta">
        <SubjectCode>{subj(db, m.subject).code}</SubjectCode>
        <span className="muted">
          {fmtDateL(m.date)} · {shortNameOf(db, subjTeacher(db, m.cls, m.subject))}
        </span>
        {onRemove ? <ConfirmButton onConfirm={onRemove}>Remove</ConfirmButton> : null}
      </div>
      <h3>{m.title}</h3>
      {m.text ? <div className="body">{m.text}</div> : null}
      {m.file ? <Thumb file={m.file} /> : null}
      {m.file ? (
        <div className="attach">
          <Paperclip size={15} strokeWidth={2} />
          <span>{m.file.name}</span>
          <span className="muted">{fmtSize(m.file.size)}</span>
        </div>
      ) : null}
    </article>
  );
}
