"use server";

import { headers } from "next/headers";

import {
  authErrorMessage,
  authFormError,
  type AuthFormState,
  forgotPasswordSchema,
  initialAuthFormState,
  invalidAuthFields,
  readAuthFormValues,
} from "@/lib/auth/form";
import { resetPasswordPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

const appOrigin = async () => {
  const headerStore = await headers();
  const host = (
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    ""
  )
    .split(",")[0]
    ?.trim();

  if (!host) {
    return null;
  }

  const proto = (headerStore.get("x-forwarded-proto") ?? "http")
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  if (proto !== "http" && proto !== "https") {
    return null;
  }

  return `${proto}://${host}`;
};

const requestPasswordResetAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const values = readAuthFormValues(formData);
  const parsed = forgotPasswordSchema.safeParse({ email: values.email });

  if (!parsed.success) {
    return invalidAuthFields(parsed.error, values);
  }

  const origin = await appOrigin();

  if (!origin) {
    return authFormError(
      "Could not send a reset email. Try again.",
      {},
      values,
    );
  }

  const redirectTo = new URL("/auth/callback", origin);
  redirectTo.searchParams.set("next", resetPasswordPath);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: redirectTo.toString() },
  );

  if (error) {
    return authFormError(authErrorMessage(error.message), {}, values);
  }

  return {
    ...initialAuthFormState,
    status: "success",
    message:
      "If an account exists for that email, we sent a link to choose a new password.",
    values,
  };
};

export { requestPasswordResetAction };
