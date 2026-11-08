import * as z from "zod";

import {
  displayNameSchema,
  passwordMismatch,
  passwordSchema,
  passwordsMatch,
} from "@/lib/auth/form";
import { firstIssueMessage } from "@/lib/forms";

const profileFormSchema = z.object({
  name: displayNameSchema,
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine(passwordsMatch, passwordMismatch);

const deleteAccountSchema = z.object({
  email: z.email("Enter the email on this account.").trim(),
});

type SettingsFormValues = {
  name?: string;
  email?: string;
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
};

type SettingsFormState = {
  status: "idle" | "error" | "success";
  message: string;
  values: SettingsFormValues;
};

const initialSettingsFormState: SettingsFormState = {
  status: "idle",
  message: "",
  values: {},
};

const settingsState = (
  status: SettingsFormState["status"],
  message: string,
  values: SettingsFormValues = {},
): SettingsFormState => {
  return { status, message, values };
};

const settingsError = (
  error: z.ZodError,
  values: SettingsFormValues = {},
): SettingsFormState => {
  return settingsState("error", firstIssueMessage(error), values);
};

export {
  deleteAccountSchema,
  initialSettingsFormState,
  passwordFormSchema,
  profileFormSchema,
  settingsError,
  settingsState,
};
export type { SettingsFormState };
