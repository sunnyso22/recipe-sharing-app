import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", "confirm");
    return NextResponse.redirect(url);
  }

  return null;
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
  await supabase.auth.getClaims();

  return supabaseResponse;
};

export { updateSession };
