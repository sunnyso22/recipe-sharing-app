import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { confirmErrorPath, safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirect(next);
    }
  }

  redirect(confirmErrorPath);
};

export { GET };
