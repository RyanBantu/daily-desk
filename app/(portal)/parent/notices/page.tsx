"use client";

import { NoticeList } from "@/components/NoticeList";
import { Panel } from "@/components/Panel";
import { ParentHead } from "@/components/StudentHead";
import { useChild } from "@/lib/hooks";
import { noticesFor } from "@/lib/selectors";
import { useDb } from "@/lib/store";

export default function ParentNotices() {
  const db = useDb();
  const c = useChild();
  if (!c) return null;
  return (
    <>
      <ParentHead title="School notices" />
      <Panel>
        <NoticeList list={noticesFor(db, c.cls)} />
      </Panel>
    </>
  );
}
