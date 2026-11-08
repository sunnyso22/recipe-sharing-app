import { io } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

const claimString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// The Auth users list shows raw_user_meta_data.name as Display name.
const readDisplayName = (
  metadata: { name?: unknown } | undefined,
  email: string,
) => {
  const name = claimString(metadata?.name);

  if (name) {
    return name;
  }

  const local = email.split("@")[0];
  return local && local.length > 0 ? local : email;
};

const getAuthUser = async (): Promise<AuthUser | null> => {
  // getClaims() checks JWT expiry with Date.now(). Cache Components rejects
  // that during prerender, so suspend before the check and fill it at request time.
  await io();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return null;
    }

    const id = claimString(data.claims.sub);
    const email = claimString(data.claims.email);

    if (!id || !email) {
      return null;
    }

    return {
      id,
      email,
      name: readDisplayName(data.claims.user_metadata, email),
    };
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

const requireAuthUser = async () => {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return user;
};

export { getAuthUser, requireAuthUser };
export type { AuthUser };
