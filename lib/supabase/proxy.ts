import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { liveAuthAccount } from "@/db/queries/live-account";
import { implicitCallbackRewrite } from "@/lib/auth/implicit-grant";
import {
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
  let claims = data?.claims;
  const clearLocalSession = async () => {
    await supabase.auth.signOut({ scope: "local" });
  };

  if (await clearSessionIfAuthEnded(error, clearLocalSession)) {
    claims = undefined;
  } else if (claims) {
    const decision = await settleAuthSession(claims, {
      liveAccount: liveAuthAccount,
      clearLocalSession,
    });

    if (decision.status === "revoked") {
      claims = undefined;
    }
  }

  const pathname = request.nextUrl.pathname;
  const needsAuth =
    pathname === "/cookbook" ||
    pathname.startsWith("/cookbook/") ||
    pathname === "/bookmarks" ||
    pathname.startsWith("/bookmarks/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/recipes/new" ||
    /^\/recipes\/[^/]+\/edit\/?$/.test(pathname);

  if (needsAuth && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return supabaseResponse;
};

export { updateSession };
