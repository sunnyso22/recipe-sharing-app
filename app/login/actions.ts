"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import {
  authFormError,
  type AuthFormState,
  authFormValuesForClient,
  initialAuthFormState,
  invalidAuthFields,
  readAuthFormValues,
  signInFormSchema,
  signUpFormSchema,
} from "@/lib/auth/form";
import { safeNextPath } from "@/lib/auth/paths";

const checkYourEmail =
  "Check your email for a link to confirm it and sign in.";

const signInFailureMessage = "Email or password is incorrect.";

const requestHeaders = async () => {
  return new Headers(await headers());
};

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

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await requestHeaders(),
    });
  } catch {
    return authFormError(signInFailureMessage, {}, values);
  }

  const next = formData.get("next");
  redirect(typeof next === "string" ? safeNextPath(next) : "/");
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

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/",
      },
      headers: await requestHeaders(),
    });
  } catch {
    return authFormError("Something went wrong. Try again.", {}, values);
  }

  return {
    ...initialAuthFormState,
    status: "success",
    message: checkYourEmail,
    values: authFormValuesForClient(values),
  };
};

const signOutAction = async () => {
  await auth.api.signOut({
    headers: await requestHeaders(),
  });
  redirect("/");
};

export { signInAction, signOutAction, signUpAction };
