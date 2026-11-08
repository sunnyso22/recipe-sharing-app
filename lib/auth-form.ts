import * as z from "zod";

const emailSchema = z.email("Enter a valid email.").trim();

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

const signInFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

const signUpFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter your name.")
      .max(80, "Use 80 characters or fewer."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

type AuthField = "name" | "email" | "password" | "confirmPassword";

type AuthFieldErrors = Partial<Record<AuthField, string>>;

type AuthFormState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: AuthFieldErrors;
};

const initialAuthFormState: AuthFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
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
  initialAuthFormState,
  readAuthFieldErrors,
  signInFormSchema,
  signUpFormSchema,
};
export type { AuthFormState };
