import * as z from "zod";

import { firstIssueMessage } from "@/lib/forms";
import { deleteAccountSchema } from "@/lib/settings/form";

type AuthErrorLike = {
  message: string;
};

type DeleteAccountDeps = {
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{
    error: AuthErrorLike | null;
    userId: string | null;
  }>;
  signOut: (options: {
    scope: "global" | "local";
  }) => Promise<{ error: AuthErrorLike | null }>;
  deleteUserAccount: (userId: string) => Promise<void>;
};

type DeleteAccountInput = {
  userId: string;
  email: string;
  password: string;
};

type DeleteAccountResult =
  | { status: "invalid"; message: string }
  | { status: "incorrect-password" }
  | { status: "delete-failed" }
  | { status: "deleted" };

const sameUserId = (left: string, right: string) => {
  return left.toLowerCase() === right.toLowerCase();
};

const confirmAndDeleteAccount = async (
  input: DeleteAccountInput,
  deps: DeleteAccountDeps,
): Promise<DeleteAccountResult> => {
  const parsed = deleteAccountSchema.safeParse({
    password: input.password,
  });

  if (!parsed.success) {
    return { status: "invalid", message: firstIssueMessage(parsed.error) };
  }

  if (!z.uuid().safeParse(input.userId).success) {
    return { status: "delete-failed" };
  }

  const signedIn = await deps.signInWithPassword({
    email: input.email,
    password: parsed.data.password,
  });

  const passwordMatchesAccount =
    !signedIn.error &&
    signedIn.userId !== null &&
    sameUserId(signedIn.userId, input.userId);

  if (!passwordMatchesAccount) {
    return { status: "incorrect-password" };
  }

  try {
    const { error } = await deps.signOut({ scope: "global" });

    if (error) {
      await deps.signOut({ scope: "local" });
    }
  } catch {
    try {
      await deps.signOut({ scope: "local" });
    } catch {
      // Still delete the account. This browser may keep its cookie until the JWT expires.
    }
  }

  try {
    await deps.deleteUserAccount(input.userId);
  } catch {
    return { status: "delete-failed" };
  }

  return { status: "deleted" };
};

export { confirmAndDeleteAccount };
export type { DeleteAccountDeps, DeleteAccountResult };
