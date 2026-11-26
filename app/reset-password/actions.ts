"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import {
  authFormError,
  type AuthFormState,
  invalidAuthFields,
  readAuthFormValues,
  resetPasswordSchema,
} from "@/lib/auth/form";
import { expiredResetMessage } from "@/lib/auth/paths";
import { liveReset } from "@/lib/auth/reset-record";
import { readFormString } from "@/lib/forms";

const requestHeaders = async () => {
  return new Headers(await headers());
};

const updateRecoveredPasswordAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const values = readAuthFormValues(formData);
  const parsed = resetPasswordSchema.safeParse({
    password: values.password,
    confirmPassword: values.confirmPassword,
  });

  if (!parsed.success) {
    return invalidAuthFields(parsed.error, values);
  }

  const token = readFormString(formData, "token");
  const account = await liveReset(token);

  if (!account) {
    return authFormError(expiredResetMessage);
  }

  try {
    await auth.api.resetPassword({
      body: {
        newPassword: parsed.data.password,
        token,
      },
      headers: await requestHeaders(),
    });
  } catch {
    return authFormError(expiredResetMessage);
  }

  await auth.api.signOut({
    headers: await requestHeaders(),
  });
  await auth.api.signInEmail({
    body: {
      email: account.email,
      password: parsed.data.password,
    },
    headers: await requestHeaders(),
  });
  redirect("/");
};

export { updateRecoveredPasswordAction };
