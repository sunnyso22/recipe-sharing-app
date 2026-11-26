"use server";

import {
  authFormError,
  type AuthFormState,
  authFormValuesForClient,
  forgotPasswordSchema,
  invalidAuthFields,
  readAuthFormValues,
} from "@/lib/auth/form";

// Reset messages are a later slice. This screen still accepts an email
// without calling Supabase Auth, and it does not pretend a message was sent.
const requestPasswordResetAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const values = readAuthFormValues(formData);
  const parsed = forgotPasswordSchema.safeParse({ email: values.email });

  if (!parsed.success) {
    return invalidAuthFields(parsed.error, values);
  }

  return authFormError(
    "Could not send a reset email. Try again.",
    {},
    authFormValuesForClient(values),
  );
};

export { requestPasswordResetAction };
