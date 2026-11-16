import {
  authErrorMessage,
  authFormError,
  type AuthFormState,
  initialAuthFormState,
  invalidAuthFields,
  readAuthFormValues,
  signUpFormSchema,
} from "@/lib/auth/form";

type SignUpAuthError = {
  message: string;
  code?: string | null;
  status?: number | null;
};

type SignUpCallResult = {
  data: {
    user: { identities?: unknown[] | null } | null;
    session: unknown;
  };
  error: SignUpAuthError | null;
};

type SignUpDeps = {
  signUp: (credentials: {
    email: string;
    password: string;
    options: {
      data: {
        name: string;
      };
    };
  }) => Promise<SignUpCallResult>;
};

const signUpConfirmationMessage =
  "Check your email for a confirmation link, then sign in.";

// Auth uses these when an email is already registered and it does not return
// the obfuscated user (for example when Confirm email or Confirm phone is off).
const duplicateSignUpCodes = new Set([
  "email_exists",
  "identity_already_exists",
  "user_already_exists",
]);

const isDuplicateSignUpError = (error: SignUpAuthError) => {
  const code = error.code?.toLowerCase();

  if (code && duplicateSignUpCodes.has(code)) {
    return true;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("already exists")
  );
};

const signUpSuccessState = (): AuthFormState => {
  return {
    ...initialAuthFormState,
    status: "success",
    message: signUpConfirmationMessage,
  };
};

const completeSignUp = async (
  formData: FormData,
  deps: SignUpDeps,
): Promise<AuthFormState> => {
  const values = readAuthFormValues(formData);
  const parsed = signUpFormSchema.safeParse({
    name: values.name,
    email: values.email,
    password: values.password,
    confirmPassword: values.confirmPassword,
  });

  if (!parsed.success) {
    return invalidAuthFields(parsed.error, values);
  }

  const { error } = await deps.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  });

  // A new email, an obfuscated existing user (empty identities), a
  // duplicate-account error, and a session all share this state. Branching
  // on any of those would show whether the email is registered.
  if (error && !isDuplicateSignUpError(error)) {
    return authFormError(authErrorMessage(error.message), {}, values);
  }

  return signUpSuccessState();
};

export { completeSignUp, signUpConfirmationMessage };
export type { SignUpDeps };
