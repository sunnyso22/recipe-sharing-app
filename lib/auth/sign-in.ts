import {
  authFormError,
  type AuthFormState,
  invalidAuthFields,
  readAuthFormValues,
  signInFormSchema,
} from "@/lib/auth/form";
import { safeNextPath } from "@/lib/auth/paths";

type SignInAuthError = {
  message: string;
  code?: string | null;
};

type SignInCredentials = {
  email: string;
  password: string;
};

type SignInDeps = {
  signInWithPassword: (
    credentials: SignInCredentials,
  ) => Promise<{ error: SignInAuthError | null }>;
};

type SignInResult =
  | { status: "error"; state: AuthFormState }
  | { status: "redirect"; path: string };

// Separate from authErrorMessage so recovery, sign-up, and settings keep
// their existing copy. An unknown account, a wrong password, an unconfirmed
// account, and similar account-status failures share one sign-in message.
const signInFailureMessage = "Email or password is incorrect.";

const signInRateLimitMessage = "Too many attempts. Wait a little and try again.";

const signInUnexpectedMessage = "Something went wrong. Try again.";

const accountStatusCodes = new Set([
  "invalid_credentials",
  "email_not_confirmed",
  "phone_not_confirmed",
  "user_banned",
  "user_not_found",
  "user_sso_managed",
]);

const accountStatusMessages = new Set([
  "invalid login credentials",
  "email not confirmed",
  "phone not confirmed",
  "user is banned",
  "user not found",
]);

const rateLimitCodes = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
]);

const signInErrorMessage = (error: SignInAuthError) => {
  const code = error.code?.trim().toLowerCase() ?? "";
  const message = error.message.trim().toLowerCase();

  if (rateLimitCodes.has(code) || message.includes("rate limit")) {
    return signInRateLimitMessage;
  }

  if (accountStatusCodes.has(code) || accountStatusMessages.has(message)) {
    return signInFailureMessage;
  }

  return signInUnexpectedMessage;
};

const completeSignIn = async (
  formData: FormData,
  deps: SignInDeps,
): Promise<SignInResult> => {
  const values = readAuthFormValues(formData);
  const parsed = signInFormSchema.safeParse({
    email: values.email,
    password: values.password,
  });

  if (!parsed.success) {
    return {
      status: "error",
      state: invalidAuthFields(parsed.error, values),
    };
  }

  const { error } = await deps.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      state: authFormError(signInErrorMessage(error), {}, values),
    };
  }

  const next = formData.get("next");

  return {
    status: "redirect",
    path: typeof next === "string" ? safeNextPath(next) : "/",
  };
};

export { completeSignIn };
export type { SignInDeps };
