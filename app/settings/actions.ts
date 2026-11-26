"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { requireAuthUser } from "@/lib/auth/session";
import { readFormString } from "@/lib/forms";
import {
  passwordFormSchema,
  profileFormSchema,
  settingsError,
  type SettingsFormState,
  settingsState,
} from "@/lib/settings/form";

const requestHeaders = async () => {
  return new Headers(await headers());
};

const updateNameAction = async (
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> => {
  await requireAuthUser();

  const values = { name: readFormString(formData, "name") };
  const parsed = profileFormSchema.safeParse(values);

  if (!parsed.success) {
    return settingsError(parsed.error, values);
  }

  try {
    await auth.api.updateUser({
      body: { name: parsed.data.name },
      headers: await requestHeaders(),
    });
  } catch {
    return settingsState("error", "Something went wrong. Try again.", values);
  }

  revalidatePath("/", "layout");

  return settingsState("success", "Display name updated.", {
    name: parsed.data.name,
  });
};

const updatePasswordAction = async (
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> => {
  await requireAuthUser();

  const values = {
    currentPassword: readFormString(formData, "currentPassword"),
    password: readFormString(formData, "password"),
    confirmPassword: readFormString(formData, "confirmPassword"),
  };
  const parsed = passwordFormSchema.safeParse(values);

  if (!parsed.success) {
    return settingsError(parsed.error);
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.password,
        revokeOtherSessions: true,
      },
      headers: await requestHeaders(),
    });
  } catch {
    return settingsState("error", "Current password is incorrect.");
  }

  return settingsState("success", "Password updated.");
};

const deleteAccountAction = async (
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> => {
  await requireAuthUser();
  const password = readFormString(formData, "password");

  if (password.length === 0) {
    return settingsState("error", "Enter your password.");
  }

  try {
    await auth.api.deleteUser({
      body: { password },
      headers: await requestHeaders(),
    });
  } catch {
    return settingsState("error", "Password is incorrect.");
  }

  redirect("/");
};

export { deleteAccountAction, updateNameAction, updatePasswordAction };
