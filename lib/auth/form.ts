import * as z from "zod";

import { formFallbackMessage, readFormString } from "@/lib/forms";

const emailSchema = z.email("Enter a valid email.").trim();

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a display name.")
  .max(80, "Use 80 characters or fewer.");

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

const passwordHint =
  "At least 8 characters, with uppercase, lowercase, and a number.";

const passwordsMatch = (value: {
  password: string;
  confirmPassword: string;
}) => {
  return value.password === value.confirmPassword;
};

const passwordMismatch = {
  path: ["confirmPassword"],
  error: "Passwords do not match.",
};

const signInFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

const signUpFormSchema = z
  .object({
    name: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine(passwordsMatch, passwordMismatch);

type AuthField = "name" | "email" | "password" | "confirmPassword";

type AuthFieldErrors = Partial<Record<AuthField, string>>;

type AuthFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthFormState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: AuthFieldErrors;
  values: AuthFormValues;
};

const emptyAuthFormValues: AuthFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const initialAuthFormState: AuthFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: emptyAuthFormValues,
};

const readAuthFormValues = (formData: FormData): AuthFormValues => {
  return {
    name: readFormString(formData, "name"),
    email: readFormString(formData, "email"),
    password: readFormString(formData, "password"),
    confirmPassword: readFormString(formData, "confirmPassword"),
  };
};

const authFields = new Set<AuthField>([
  "name",
  "email",
  "password",
  "confirmPassword",
]);

const readAuthFieldErrors = (error: z.ZodError) => {
  const fieldErrors: AuthFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      authFields.has(field as AuthField) &&
      !fieldErrors[field as AuthField]
    ) {
      fieldErrors[field as AuthField] = issue.message;
    }
  }

  return fieldErrors;
};

const authFormError = (
  message: string,
  fieldErrors: AuthFieldErrors = {},
  values: AuthFormValues = emptyAuthFormValues,
): AuthFormState => {
  return {
    status: "error",
    message,
    fieldErrors,
    values,
  };
};

const invalidAuthFields = (
  error: z.ZodError,
  values: AuthFormValues,
): AuthFormState => {
  const fieldErrors = readAuthFieldErrors(error);

  return authFormError(
    fieldErrors.name ??
      fieldErrors.email ??
      fieldErrors.password ??
      fieldErrors.confirmPassword ??
      formFallbackMessage,
    fieldErrors,
    values,
  );
};

const authErrorMessage = (message: string) => {
  if (message === "Invalid login credentials") {
    return "Email or password is incorrect.";
  }

  if (message === "Email not confirmed") {
    return "Confirm your email before signing in.";
  }

  if (message.toLowerCase().includes("rate limit")) {
    return "Too many attempts. Wait a little and try again.";
  }

  return message;
};

export {
  authErrorMessage,
  authFormError,
  displayNameSchema,
  initialAuthFormState,
  invalidAuthFields,
  passwordHint,
  passwordMismatch,
  passwordSchema,
  passwordsMatch,
  readAuthFormValues,
  signInFormSchema,
  signUpFormSchema,
};
export type { AuthFormState };
