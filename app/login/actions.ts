"use server";

import { redirect } from "next/navigation";

import {
  authErrorMessage,
  type AuthFormState,
  readAuthFieldErrors,
  signInFormSchema,
  signUpFormSchema,
} from "@/lib/auth-form";
import { createClient } from "@/lib/supabase/server";

const invalidFields = (
  error: ReturnType<typeof readAuthFieldErrors>,
): AuthFormState => {
  const message =
    error.name ??
    error.email ??
    error.password ??
    error.confirmPassword ??
    "Check the form and try again.";

  return {
    status: "error",
    message,
    fieldErrors: error,
  };
};

const signInAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const parsed = signInFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return invalidFields(readAuthFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: authErrorMessage(error.message),
      fieldErrors: {},
    };
  }

  redirect("/");
};

const signUpAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const parsed = signUpFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return invalidFields(readAuthFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: authErrorMessage(error.message),
      fieldErrors: {},
    };
  }

  if (data.session) {
    redirect("/");
  }

  if (data.user && data.user.identities?.length === 0) {
    return {
      status: "error",
      message: "An account with this email already exists. Sign in instead.",
      fieldErrors: {},
    };
  }

  return {
    status: "success",
    message: "Check your email for a confirmation link, then sign in.",
    fieldErrors: {},
  };
};

const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
};

export { signInAction, signOutAction, signUpAction };
