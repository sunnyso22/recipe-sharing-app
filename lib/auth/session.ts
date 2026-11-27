import { io } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth/auth";
import { signInPath } from "@/lib/auth/paths";

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

const signedInUser = async (
  requestHeaders: Headers,
): Promise<AuthUser | null> => {
  try {
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user.emailVerified) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("does not match either")
    ) {
      return null;
    }

    throw error;
  }
};

const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  // Session expiry uses the current time. Cache Components rejects that
  // during prerender, so suspend before the lookup and fill it per request.
  await io();

  return signedInUser(new Headers(await headers()));
});

const requireAuthUser = async (returnPath = "/") => {
  const user = await getAuthUser();

  if (!user) {
    redirect(signInPath(returnPath));
  }

  return user;
};

export { getAuthUser, requireAuthUser, signedInUser };
export type { AuthUser };
