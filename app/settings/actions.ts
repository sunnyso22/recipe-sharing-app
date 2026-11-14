"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteUserAccount } from "@/db/queries/accounts";
import { authErrorMessage } from "@/lib/auth/form";
import { requireAuthUser } from "@/lib/auth/session";
import { readFormString } from "@/lib/forms";
import { confirmAndDeleteAccount } from "@/lib/settings/delete-account";
import {
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
    return settingsError(parsed.error);
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return settingsState("error", "Current password is incorrect.");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return settingsState("error", authErrorMessage(error.message));
  }

  return settingsState("success", "Password updated.");
};

const deleteAccountAction = async (
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> => {
  const user = await requireAuthUser();
  const supabase = await createClient();
  const result = await confirmAndDeleteAccount(
    {
      userId: user.id,
      email: user.email,
      password: readFormString(formData, "password"),
    },
    {
      signInWithPassword: async (credentials) => {
        const { data, error } =
          await supabase.auth.signInWithPassword(credentials);

        return {
          error,
          userId: data.user?.id ?? null,
        };
      },
      signOut: (options) => supabase.auth.signOut(options),
      deleteUserAccount,
    },
  );

  if (result.status === "invalid") {
    return settingsState("error", result.message);
  }

  if (result.status === "incorrect-password") {
    return settingsState("error", "Password is incorrect.");
  }

  if (result.status === "delete-failed") {
    return settingsState("error", "Could not delete this account. Try again.");
  }

  redirect("/");
};

export { deleteAccountAction, updateNameAction, updatePasswordAction };
