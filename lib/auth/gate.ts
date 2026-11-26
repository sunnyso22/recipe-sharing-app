import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

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

const gateRequest = (request: NextRequest) => {
  const pathname = normalizedPath(request.nextUrl.pathname);
  const sessionCookie = getSessionCookie(request);

  if (requiresSession(pathname) && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (sessionCookie && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};

export { gateRequest, requiresSession };
