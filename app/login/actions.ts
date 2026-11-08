"use server";

import { redirect } from "next/navigation";

import {
  authErrorMessage,
  authFormError,
  type AuthFormState,
  initialAuthFormState,
  invalidAuthFields,
  readAuthFormValues,
  signInFormSchema,
  signUpFormSchema,
} from "@/lib/auth/form";
import { createClient } from "@/lib/supabase/server";

const signInAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const values = readAuthFormValues(formData);
  const parsed = signInFormSchema.safeParse({
    email: values.email,
    password: values.password,
  });

  if (!parsed.success) {
    return invalidAuthFields(parsed.error, values);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return authFormError(authErrorMessage(error.message), {}, values);
  }

  redirect("/");
};

const signUpAction = async (
  _state: AuthFormState,
  formData: FormData,
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
    return authFormError(authErrorMessage(error.message), {}, values);
  }

  if (data.session) {
    redirect("/");
  }

  if (data.user && data.user.identities?.length === 0) {
    return authFormError(
      "An account with this email already exists. Sign in instead.",
      {},
      values,
    );
  }

  return {
    ...initialAuthFormState,
    status: "success",
    message: "Check your email for a confirmation link, then sign in.",
  };
};

const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
};

export { signInAction, signOutAction, signUpAction };
