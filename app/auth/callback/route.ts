import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

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

  redirect(recovering ? recoveryErrorPath : confirmErrorPath);
};

export { GET };
