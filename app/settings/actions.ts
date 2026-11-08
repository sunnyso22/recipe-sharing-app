"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { deleteUserAccount } from "@/db/queries/accounts";
import { authErrorMessage } from "@/lib/auth/form";
import { requireAuthUser } from "@/lib/auth/session";
import { readFormString } from "@/lib/forms";
import {
  deleteAccountSchema,
  passwordFormSchema,
  profileFormSchema,
  settingsError,
  type SettingsFormState,
  settingsState,
} from "@/lib/settings/form";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { name: parsed.data.name },
  });

  if (error) {
    return settingsState("error", authErrorMessage(error.message), values);
  }

  // updateUser keeps the current access token. Refresh it so the header
  // reads the new name from the JWT.
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");

  return settingsState("success", "Display name updated.", {
    name: parsed.data.name,
  });
};

const updatePasswordAction = async (
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> => {
  const user = await requireAuthUser();

  const values = {
    currentPassword: readFormString(formData, "currentPassword"),
    password: readFormString(formData, "password"),
    confirmPassword: readFormString(formData, "confirmPassword"),
  };
  const parsed = passwordFormSchema.safeParse(values);

  if (!parsed.success) {
    return settingsError(parsed.error, values);
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return settingsState("error", "Current password is incorrect.", values);
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return settingsState("error", authErrorMessage(error.message), values);
  }

  return settingsState("success", "Password updated.");
};

const deleteAccountAction = async (
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> => {
  const user = await requireAuthUser();

  const values = { email: readFormString(formData, "email") };
  const parsed = deleteAccountSchema.safeParse(values);

  if (!parsed.success) {
    return settingsError(parsed.error, values);
  }

  if (parsed.data.email.toLowerCase() !== user.email.toLowerCase()) {
    return settingsState(
      "error",
      "Enter the email on this account to confirm.",
      values,
    );
  }

  const deleteFailed = settingsState(
    "error",
    "Could not delete this account. Try again.",
    values,
  );

  if (!z.uuid().safeParse(user.id).success) {
    return deleteFailed;
  }

  try {
    await deleteUserAccount(user.id);
  } catch {
    return deleteFailed;
  }

  const supabase = await createClient();

  try {
    await supabase.auth.signOut();
  } catch {
    // The account is already gone. Clear the session when the API allows it.
  }

  redirect("/");
};

export { deleteAccountAction, updateNameAction, updatePasswordAction };
