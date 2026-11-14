"use server";

import { redirect } from "next/navigation";

import {
  authErrorMessage,
  authFormError,
  type AuthFormState,
  invalidAuthFields,
  readAuthFormValues,
  signInFormSchema,
} from "@/lib/auth/form";
import { safeNextPath } from "@/lib/auth/paths";
import { completeSignUp } from "@/lib/auth/sign-up";
import { createClient, createSignUpClient } from "@/lib/supabase/server";

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

  const next = formData.get("next");
  redirect(typeof next === "string" ? safeNextPath(next) : "/");
};

const signUpAction = async (
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const supabase = createSignUpClient();

  return completeSignUp(formData, {
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
