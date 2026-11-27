import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { signInPath } from "@/lib/auth/paths";
import { signedInUser } from "@/lib/auth/session";

const normalizedPath = (pathname: string) => {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
};

const requiresSession = (pathname: string) => {
  return (
    pathname === "/cookbook" ||
    pathname.startsWith("/cookbook/") ||
    pathname === "/bookmarks" ||
    pathname.startsWith("/bookmarks/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/recipes/new" ||
    /^\/recipes\/[^/]+\/edit$/.test(pathname)
  );
};

const gateRequest = async (request: NextRequest) => {
  const pathname = normalizedPath(request.nextUrl.pathname);
  const sessionCookie = getSessionCookie(request);

  if (requiresSession(pathname) && !sessionCookie) {
    const returnPath = `${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(signInPath(returnPath), request.url));
  }

  if (
    sessionCookie &&
    (pathname === "/login" || pathname === "/signup") &&
    (await signedInUser(request.headers))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};

export { gateRequest, requiresSession };
