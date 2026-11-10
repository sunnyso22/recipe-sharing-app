"use server";

import { redirect } from "next/navigation";

import {
  authErrorMessage,
  authFormError,
  type AuthFormState,
  invalidAuthFields,
  readAuthFormValues,
  resetPasswordSchema,
} from "@/lib/auth/form";
import {
  clearPasswordRecoveryCookie,
  hasPasswordRecoveryCookie,
} from "@/lib/auth/recovery";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const expiredMessage =
  "This reset link is invalid or has expired. Request a new one.";

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

  const [recovery, user] = await Promise.all([
    hasPasswordRecoveryCookie(),
    getAuthUser(),
  ]);

  if (!recovery || !user) {
    return authFormError(expiredMessage, {}, values);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return authFormError(authErrorMessage(error.message), {}, values);
  }

  await clearPasswordRecoveryCookie();
  redirect("/");
};

export { updateRecoveredPasswordAction };
