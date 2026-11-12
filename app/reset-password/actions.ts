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
import { expiredResetMessage } from "@/lib/auth/paths";
import {
  clearPasswordRecoveryCookie,
  hasPasswordRecoveryCookie,
} from "@/lib/auth/recovery";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

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

  const user = await getAuthUser();

  if (!user || !(await hasPasswordRecoveryCookie(user.id))) {
    return authFormError(expiredResetMessage);
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
