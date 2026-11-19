import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { liveAuthAccount } from "@/db/queries/live-account";
import { implicitCallbackRewrite } from "@/lib/auth/implicit-grant";
import {
  type AuthDecision,
  clearSessionIfAuthEnded,
  settleAuthSession,
} from "@/lib/auth/live-session";
import { confirmErrorPath } from "@/lib/auth/paths";
import { getSupabaseEnv } from "@/lib/supabase/env";

const redirectAuthCallback = (request: NextRequest) => {
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  if (searchParams.get("error_code") && pathname !== "/login") {
    const url = request.nextUrl.clone();
    const target = new URL(confirmErrorPath, url);
    url.pathname = target.pathname;
    url.search = target.search;
    return NextResponse.redirect(url);
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  const handoff = implicitCallbackRewrite({
    pathname,
    next: searchParams.get("next"),
  });

  if (!handoff) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = handoff;
  return NextResponse.rewrite(url);
};

type ProxySessionDeps = Parameters<typeof settleAuthSession>[1];

type ProxySession = {
  claims: Parameters<typeof settleAuthSession>[0];
  decision: AuthDecision;
};

// A live session is an auth user id that still has an account and a session
// row. Display name and user_metadata are not part of that decision.
const guestAuthRedirect = (pathname: string, decision: AuthDecision) => {
  if (decision.status !== "active") {
    return null;
  }

  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (path !== "/login" && path !== "/signup") {
    return null;
  }

  return "/";
};

const resolveProxySession = async (
  claims: ProxySession["claims"],
  error: { code?: unknown } | null | undefined,
  deps: ProxySessionDeps,
): Promise<ProxySession> => {
  let sessionClaims = claims;
  let decision: AuthDecision = { status: "anonymous" };

  if (await clearSessionIfAuthEnded(error, deps.clearLocalSession)) {
    sessionClaims = undefined;
  } else if (sessionClaims) {
    decision = await settleAuthSession(sessionClaims, deps);

    if (decision.status === "revoked") {
      sessionClaims = undefined;
    }
  }

  return { claims: sessionClaims, decision };
};

const redirectWithSession = (
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
) => {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
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
    /^\/recipes\/[^/]+\/edit\/?$/.test(pathname)
  );
};

const applyProxySession = (
  request: NextRequest,
  supabaseResponse: NextResponse,
  session: ProxySession,
) => {
  const pathname = request.nextUrl.pathname;

  if (requiresSession(pathname) && !session.claims) {
    return redirectWithSession(request, supabaseResponse, "/login");
  }

  const home = guestAuthRedirect(pathname, session.decision);

  if (home) {
    return redirectWithSession(request, supabaseResponse, home);
  }

  return supabaseResponse;
};

const updateSession = async (request: NextRequest) => {
  const callbackRedirect = redirectAuthCallback(request);
  if (callbackRedirect) {
    return callbackRedirect;
  }

  let supabaseResponse = NextResponse.next();

  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([header, value]) => {
          supabaseResponse.headers.set(header, value);
        });
      },
    },
  });

  // Refresh the session before any other auth work. Extra work in between
  // can rotate the refresh token twice and sign the user out.
  const { data, error } = await supabase.auth.getClaims();
  const clearLocalSession = async () => {
    await supabase.auth.signOut({ scope: "local" });
  };
  const session = await resolveProxySession(data?.claims, error, {
    liveAccount: liveAuthAccount,
    clearLocalSession,
  });

  return applyProxySession(request, supabaseResponse, session);
};

export {
  applyProxySession,
  guestAuthRedirect,
  resolveProxySession,
  updateSession,
};
