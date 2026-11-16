import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { implicitCallbackRewrite } from "@/lib/auth/implicit-grant";
import {
  confirmErrorPath,
  recoveryErrorPath,
  resetPasswordPath,
  safeNextPath,
} from "@/lib/auth/paths";
import { rememberPasswordRecovery } from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const recovering = next === resetPasswordPath;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (recovering) {
        const { data: claimsData } = await supabase.auth.getClaims();

        try {
          const remembered = await rememberPasswordRecovery(
            claimsData?.claims.sub,
          );

          if (!remembered) {
            redirect(recoveryErrorPath);
          }
        } catch {
          redirect(recoveryErrorPath);
        }
      }

      redirect(next);
    }
  }

  const handoff = implicitCallbackRewrite({
    pathname: request.nextUrl.pathname,
    code,
    next: searchParams.get("next"),
  });

  // The proxy rewrites this request so the hash stays on /auth/callback.
  // If this route still runs, send the browser to the session page rather
  // than the confirm error page. #access_token= is not in the request.
  if (handoff) {
    const params = new URLSearchParams();
    const nextParam = searchParams.get("next");

    if (nextParam) {
      params.set("next", safeNextPath(nextParam));
    }

    const query = params.toString();
    redirect(query ? `${handoff}?${query}` : handoff);
  }

  redirect(recovering ? recoveryErrorPath : confirmErrorPath);
};

export { GET };
