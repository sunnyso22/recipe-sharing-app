import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { implicitCallbackRewrite } from "@/lib/auth/implicit-grant";
import {
  confirmedSignInPath,
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

  if (recovering) {
    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
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

        redirect(next);
      }
    }

    redirect(recoveryErrorPath);
  }

  // Auth has already confirmed the email. Do not exchange the code.
  if (code) {
    redirect(confirmedSignInPath);
  }

  const handoff = implicitCallbackRewrite({
    pathname: request.nextUrl.pathname,
    next: searchParams.get("next"),
  });

  // The proxy rewrites this request so a hash or code stays on /auth/callback
  // until the browser replaces it. If this route still runs, do not send the
  // user to the confirm error page. #access_token= is not in the request.
  if (handoff) {
    const params = new URLSearchParams();
    const nextParam = searchParams.get("next");

    if (nextParam) {
      params.set("next", safeNextPath(nextParam));
    }

    const query = params.toString();
    redirect(query ? `${handoff}?${query}` : handoff);
  }

  redirect(confirmErrorPath);
};

export { GET };
