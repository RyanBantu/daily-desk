import type { Role } from "./types";
import { ROLES, SESSION_COOKIE, isRole, writeSessionCookie as writeCookie } from "./session";

export type { Role };
export { ROLES, SESSION_COOKIE, isRole };

/** Demo only: these ship in the client bundle and are NOT secure. */
export const DEMO_PASSWORDS: Record<Role, string> = {
  admin: "admin123",
  teacher: "teach123",
  student: "stud123",
  parent: "parent123",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

export function checkDemoPassword(role: Role, password: string): boolean {
  return password.trim() === DEMO_PASSWORDS[role];
}

/** Writes the session cookie that `proxy.ts` already parses (`role:userId`). */
export function writeSessionCookie(role: Role, userId: string) {
  writeCookie({ role, userId });
}

export function clearSessionCookie() {
  writeCookie(null);
}
