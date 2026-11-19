import { io } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";

import { liveAuthAccount } from "@/db/queries/live-account";
import {
  type AuthUser,
  clearSessionIfAuthEnded,
  settleAuthSession,
} from "@/lib/auth/live-session";
import { createClient } from "@/lib/supabase/server";

const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  // getClaims() checks JWT expiry with Date.now(). Cache Components rejects
  // that during prerender, so suspend before the check and fill it at request time.
  await io();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const clearLocalSession = async () => {
      await supabase.auth.signOut({ scope: "local" });
    };

    if (await clearSessionIfAuthEnded(error, clearLocalSession)) {
      return null;
    }

    if (error || !data?.claims) {
      return null;
    }

    // Signature and expiry are not enough. settleAuthSession rejects the
    // request when this user or this session row has been deleted, and asks
    // the client to drop this browser's auth cookies.
    const decision = await settleAuthSession(data.claims, {
      liveAccount: liveAuthAccount,
      clearLocalSession,
    });

    return decision.status === "active" ? decision.user : null;
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
});

const requireAuthUser = async () => {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return user;
};

export { readDisplayName } from "@/lib/auth/live-session";
export { getAuthUser, requireAuthUser };
export type { AuthUser };
