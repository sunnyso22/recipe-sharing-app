"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import {
  type AuthFormState,
  authFormValuesForClient,
  forgotPasswordSchema,
  initialAuthFormState,
  invalidAuthFields,
  readAuthFormValues,
} from "@/lib/auth/form";

const checkYourEmail =
  "Check your email for a link to choose a new password.";

const requestHeaders = async () => {
  return new Headers(await headers());
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

  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email },
      headers: await requestHeaders(),
    });
  } catch {
    // A failed send still shows this screen. The link was removed first.
  }

  return {
    ...initialAuthFormState,
    status: "success",
    message: checkYourEmail,
    values: authFormValuesForClient(values),
  };
};

export { requestPasswordResetAction };
