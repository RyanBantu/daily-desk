"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { toast } from "@/components/Toast";
import { enrichSeed } from "./seed-analytics";
import { seed } from "./seed";
import { STORAGE_KEY, writeSessionCookie } from "./session";
import type { DB, Message, Role, Session } from "./types";
import { today, uid } from "./utils";

export interface UiState {
  tid: string;
  sid: string;
  pid: string;
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
      ui: { tid: "t1", sid: "s1", pid: "s3", tctx: "", ttCls: "10-A" },
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
        const ui = role === "admin" ? s.ui : { ...s.ui, [uiField[role]]: id, ...(role === "teacher" && id !== s.ui.tid ? { tctx: "" } : {}) };
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
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ db: s.db, session: s.session, ui: s.ui }),
      migrate: (persisted) => {
        const p = persisted as { session?: Session; ui?: UiState } | undefined;
        return {
          db: enrichSeed(seed()),
          session: p?.session ?? null,
          ui: p?.ui ?? { tid: "t1", sid: "s1", pid: "s3", tctx: "", ttCls: "10-A" },
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
    useStore.setState({ ready: true, db: s.db ?? enrichSeed(seed()) });
  });
  return booting;
}

/** Adds a message to the child's Parent › Messages. Call inside `mutate`. */
export function pushMessage(db: DB, m: Omit<Message, "id" | "date">) {
  db.messages.push({ ...m, id: uid(), date: today() });
}

/** Only call below <Ready>, where the database is guaranteed to be loaded. */
export const useDb = () => useStore((s) => s.db) as DB;
