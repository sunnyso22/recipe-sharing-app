import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import {
  confirmErrorPath,
  recoveryErrorPath,
  safeNextPath,
} from "@/lib/auth/paths";
import { setPasswordRecoveryCookie } from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

const emailOtpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));
  const recovering = type === "recovery";

  if (tokenHash && type && emailOtpTypes.has(type as EmailOtpType)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });

    if (!error) {
      if (recovering) {
        await setPasswordRecoveryCookie();
      }

      redirect(next);
    }
  }

  redirect(recovering ? recoveryErrorPath : confirmErrorPath);
};

export { GET };
