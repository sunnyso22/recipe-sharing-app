import { io } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const getAuthEmail = async () => {
  // getClaims() checks JWT expiry with Date.now(). Cache Components rejects
  // that during prerender, so suspend before the check and fill it at request time.
  await io();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return null;
    }

    const email = data.claims.email;
    return typeof email === "string" && email.length > 0 ? email : null;
  } catch (error) {
    // Next.js throws this while re-rendering the header during a Server Action.
    if (
      error instanceof Error &&
      error.message.includes("does not match either")
    ) {
      return null;
    }

    throw error;
  }
};

const safeNextPath = (value: string | null) => {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }

  return value;
};

export { getAuthEmail, safeNextPath };
