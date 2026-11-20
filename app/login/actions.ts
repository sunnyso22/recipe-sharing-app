"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { confirmationRedirectUrl } from "@/lib/auth/email-redirect";
import { type AuthFormState } from "@/lib/auth/form";
import { completeSignIn } from "@/lib/auth/sign-in";
import { completeSignUp } from "@/lib/auth/sign-up";
import { createClient, createSignUpClient } from "@/lib/supabase/server";

const signInAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const supabase = await createClient();
  const result = await completeSignIn(formData, {
    signInWithPassword: async (credentials) => {
      const { error } = await supabase.auth.signInWithPassword(credentials);

      return {
        error: error
          ? {
              message: error.message,
              code: error.code,
            }
          : null,
      };
    },
  });

  if (result.status === "redirect") {
    redirect(result.path);
  }

  return result.state;
};

const signUpAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const headerStore = await headers();
  const supabase = createSignUpClient();

  return completeSignUp(formData, {
    emailRedirectTo: confirmationRedirectUrl({
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      nodeEnv: process.env.NODE_ENV,
      host: headerStore.get("host"),
    }),
    signUp: async (credentials) => {
      const { data, error } = await supabase.auth.signUp(credentials);

      return {
        data: {
          user: data.user ? { identities: data.user.identities } : null,
          session: data.session,
        },
        error: error
          ? {
              message: error.message,
              code: error.code,
              status: error.status,
            }
          : null,
      };
    },
  });
};

const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
};

export { signInAction, signOutAction, signUpAction };
