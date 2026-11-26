"use server";

import {
  authFormError,
  type AuthFormState,
  invalidAuthFields,
  readAuthFormValues,
  resetPasswordSchema,
} from "@/lib/auth/form";
import { expiredResetMessage } from "@/lib/auth/paths";

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

  return authFormError(expiredResetMessage);
};

export { updateRecoveredPasswordAction };
