import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/overview",
  "/opportunities",
  "/saved",
  "/mentors",
  "/mentorship",
  "/profile",
  "/notifications",
  "/submit",
  "/onboarding",
  "/documents",
  "/evaluate",
  "/assistant",
  "/admin",
];

/**
 * Cheap cookie presence check so signed-out visitors bounce to /signin without
 * a round trip. The real authorisation happens in the layout and in the API,
 * which verify the signature — a forged cookie gets past here and nowhere else.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
