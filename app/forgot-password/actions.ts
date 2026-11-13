"use server";

import { headers } from "next/headers";

import {
  authErrorMessage,
  authFormError,
  type AuthFormState,
  authFormValuesForClient,
  forgotPasswordSchema,
  initialAuthFormState,
  invalidAuthFields,
  readAuthFormValues,
} from "@/lib/auth/form";
import { resetPasswordPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

const configuredOrigin = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (url.username || url.password) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
};

const localDevOrigin = async () => {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const headerStore = await headers();
  const host = headerStore.get("host")?.split(",")[0]?.trim() ?? "";

  if (
    host !== "localhost" &&
    !host.startsWith("localhost:") &&
    host !== "127.0.0.1" &&
    !host.startsWith("127.0.0.1:")
  ) {
    return null;
  }

  return `http://${host}`;
};

const appOrigin = async () => {
  return configuredOrigin() ?? (await localDevOrigin());
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
    values: authFormValuesForClient(values),
  };
};

export { requestPasswordResetAction };
