import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession, isRole } from "./lib/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.redirect(new URL("/login", request.url));

  const area = pathname.split("/")[1];
  if (!isRole(area)) return NextResponse.next();

  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  if (session.role !== area) return NextResponse.redirect(new URL(`/${session.role}`, request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/teacher/:path*", "/student/:path*", "/parent/:path*"],
};
