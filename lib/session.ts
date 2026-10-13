import type { Role, Session } from "./types";

export const SESSION_COOKIE = "demo_session";
export const STORAGE_KEY = "westbrook.portal.v2";
export const ROLES: Role[] = ["admin", "teacher", "student", "parent"];

export const isRole = (v: unknown): v is Role => typeof v === "string" && (ROLES as string[]).includes(v);

export const encodeSession = (s: Session) => encodeURIComponent(`${s.role}:${s.userId}`);

export function decodeSession(raw?: string | null): Session | null {
  if (!raw) return null;
  const [role, ...rest] = decodeURIComponent(raw).split(":");
  return isRole(role) ? { role, userId: rest.join(":") } : null;
}

export function writeSessionCookie(s: Session | null) {
  document.cookie = s
    ? `${SESSION_COOKIE}=${encodeSession(s)}; path=/; max-age=2592000; SameSite=Lax`
    : `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
