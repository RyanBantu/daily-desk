"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { toast } from "@/components/Toast";
import { enrichSeed } from "./seed-analytics";
import { seed } from "./seed";
import { STORAGE_KEY, writeSessionCookie } from "./session";
import type { DB, Message, Role, Session } from "./types";
import { today, uid } from "./utils";

const defaultUi = (): UiState => ({ tid: "t1", sid: "s1", pid: "p3", ward: "s3", tctx: "", ttCls: "10-A" });

export interface UiState {
  tid: string;
  sid: string;
  pid: string;
  /** Student id of the ward the signed-in parent is viewing */
  ward: string;
  /** "cls|subject" the teacher is working in */
  tctx: string;
  ttCls: string;
}

interface State {
  ready: boolean;
  db: DB | null;
  session: Session | null;
  ui: UiState;
  mutate: (fn: (db: DB) => void) => void;
  setUi: (patch: Partial<UiState>) => void;
  /** Saves who is signed in, for the given role, to the store and the cookie. */
  signIn: (role: Role, userId?: string) => void;
  signOut: () => void;
  reset: () => void;
}

const uiField = { teacher: "tid", student: "sid", parent: "pid" } as const;

let warned = false;
const safeStorage: StateStorage = {
  getItem: (k) => localStorage.getItem(k),
  removeItem: (k) => localStorage.removeItem(k),
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      if (!warned) toast("This browser could not save. Changes last until you reload.");
      warned = true;
    }
  },
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ready: false,
      db: null,
      session: null,
      ui: defaultUi(),
      mutate: (fn) => {
        const cur = get().db;
        if (!cur) return;
        const next = structuredClone(cur);
        fn(next);
        set({ db: next });
      },
      setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),
      signIn: (role, userId) => {
        const s = get();
        const id = role === "admin" ? "admin" : (userId ?? s.ui[uiField[role]]);
        const session = { role, userId: id };
        let ui = s.ui;
        if (role === "teacher") ui = { ...s.ui, tid: id, ...(id !== s.ui.tid ? { tctx: "" } : {}) };
        else if (role === "student") ui = { ...s.ui, sid: id };
        else if (role === "parent") {
          const kids = s.db?.parents.find((p) => p.id === id)?.children ?? [];
          ui = { ...s.ui, pid: id, ward: kids.includes(s.ui.ward) ? s.ui.ward : (kids[0] ?? "") };
        }
        writeSessionCookie(session);
        set({ session, ui });
      },
      signOut: () => {
        writeSessionCookie(null);
        set({ session: null });
      },
      reset: () => set({ db: enrichSeed(seed()) }),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ db: s.db, session: s.session, ui: s.ui }),
      migrate: (persisted) => {
        const p = persisted as { session?: Session; ui?: Partial<UiState> } | undefined;
        const db = enrichSeed(seed());
        let session = p?.session ?? null;
        const parentId = session?.role === "parent" ? session.userId : null;
        if (parentId && !db.parents.some((x) => x.id === parentId)) {
          const child = db.students.find((s) => s.id === parentId);
          session = { role: "parent", userId: child?.parentId ?? "p3" };
        }
        const pid = db.parents.some((x) => x.id === p?.ui?.pid) ? p!.ui!.pid! : "p3";
        const kids = db.parents.find((x) => x.id === pid)?.children ?? ["s3"];
        const ward = kids.includes(p?.ui?.ward ?? "") ? p!.ui!.ward! : (kids[0] ?? "s3");
        return {
          db,
          session,
          ui: { ...defaultUi(), ...p?.ui, pid, ward },
        };
      },
    },
  ),
);

let booting: Promise<void> | null = null;
/** Loads saved data from localStorage, or seeds the sample school on first visit. */
export function bootStore() {
  booting ??= Promise.resolve(useStore.persist.rehydrate()).then(() => {
    const s = useStore.getState();
    const db = s.db?.parents && s.db.fees ? s.db : enrichSeed(seed());
    useStore.setState({ ready: true, db });
  });
  return booting;
}

/** Adds a message to the child's Parent › Messages. Call inside `mutate`. */
export function pushMessage(db: DB, m: Omit<Message, "id" | "date">) {
  db.messages.push({ ...m, id: uid(), date: today() });
}

/** Only call below <Ready>, where the database is guaranteed to be loaded. */
export const useDb = () => useStore((s) => s.db) as DB;
