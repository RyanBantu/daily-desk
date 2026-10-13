"use client";

import { MessageList } from "@/components/MessageList";
import { Panel } from "@/components/Panel";
import { ParentHead } from "@/components/StudentHead";
import { useChild } from "@/lib/hooks";
import { useDb } from "@/lib/store";

export default function ParentMessages() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  return (
    <>
      <ParentHead title="Messages from teachers" sub="Scores, homework feedback and remarks your child’s teachers have sent you." />
      <Panel>
        <MessageList list={db.messages.filter((m) => m.sid === c.id).sort((a, b) => b.date.localeCompare(a.date))} />
      </Panel>
    </>
  );
}
