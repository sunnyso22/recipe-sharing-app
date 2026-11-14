import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import {
  completeSignUp,
  signUpConfirmationMessage,
  type SignUpDeps,
} from "@/lib/auth/sign-up";
import { signUpAuthOptions } from "@/lib/supabase/server";

type SignUpResult = Awaited<ReturnType<SignUpDeps["signUp"]>>;

const name = "Ada Lovelace";
const email = "ada@example.com";
const password = "Supper123";

const confirmationState = {
  status: "success",
  message: signUpConfirmationMessage,
  fieldErrors: {},
  values: {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  },
};

const signUpForm = (fields?: {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  next?: string;
}) => {
  const formData = new FormData();
  formData.set("name", fields?.name ?? name);
  formData.set("email", fields?.email ?? email);
  formData.set("password", fields?.password ?? password);
  formData.set("confirmPassword", fields?.confirmPassword ?? password);

  if (fields?.next) {
    formData.set("next", fields.next);
  }

  return formData;
};

const authResult = (result: {
  identities?: unknown[] | null;
  session?: unknown;
  error?: SignUpResult["error"];
}): SignUpResult => {
  return {
    data: {
      user:
        result.error
          ? null
          : {
              identities:
                result.identities === undefined
                  ? [{ id: "new-identity" }]
                  : result.identities,
            },
      session: result.session ?? null,
    },
    error: result.error ?? null,
  };
};

const attempt = async (formData: FormData, result: SignUpResult) => {
  const calls: Parameters<SignUpDeps["signUp"]>[0][] = [];
  const state = await completeSignUp(formData, {
    signUp: async (credentials) => {
      calls.push(credentials);
      return result;
    },
  });

  return { state, calls };
};

const registeredCredentials = {
  email,
  password,
  options: {
    data: {
      name,
    },
  },
};

describe("sign up", () => {
  test("uses one confirmation message for a new email and an existing email", async () => {
    const created = await attempt(
      signUpForm(),
      authResult({ identities: [{ id: "new-identity" }] }),
    );
    const existing = await attempt(
      signUpForm(),
      authResult({ identities: [] }),
    );
    const alreadyRegistered = await attempt(
      signUpForm({ next: "/cookbook" }),
      authResult({
        error: {
          message: "User already registered",
          code: "user_already_exists",
          status: 422,
        },
      }),
    );
    const emailExists = await attempt(
      signUpForm({ next: "/" }),
      authResult({
        error: {
          message:
            "A user with this email address has already been registered",
          code: "email_exists",
          status: 422,
        },
      }),
    );
    const signedIn = await attempt(
      signUpForm({ next: "/recipes" }),
      authResult({
        identities: [{ id: "new-identity" }],
        session: { access_token: "new-user-session" },
      }),
    );

    assert.equal(
      signUpConfirmationMessage,
      "Check your email for a confirmation link, then sign in.",
    );
    assert.deepEqual(created.state, confirmationState);
    assert.deepEqual(existing.state, created.state);
    assert.deepEqual(alreadyRegistered.state, created.state);
    assert.deepEqual(emailExists.state, created.state);
    assert.deepEqual(signedIn.state, created.state);
    assert.deepEqual(created.calls, [registeredCredentials]);
    assert.deepEqual(existing.calls, created.calls);
    assert.deepEqual(alreadyRegistered.calls, created.calls);
  });

  test("treats a duplicate-account code as success even when the message differs", async () => {
    const { state } = await attempt(
      signUpForm(),
      authResult({
        error: {
          message: "Identity is already linked to a user",
          code: "identity_already_exists",
          status: 422,
        },
      }),
    );

    assert.deepEqual(state, confirmationState);
  });

  test("treats an already-registered message without a code as success", async () => {
    const { state } = await attempt(
      signUpForm(),
      authResult({
        error: {
          message: "User already registered",
          status: 422,
        },
      }),
    );

    assert.deepEqual(state, confirmationState);
  });

  test("keeps invalid email, weak password, and mismatch errors", async () => {
    const invalidEmail = await attempt(
      signUpForm({ email: "not-an-email" }),
      authResult({}),
    );
    const weakPassword = await attempt(
      signUpForm({ password: "password1", confirmPassword: "password1" }),
      authResult({}),
    );
    const mismatch = await attempt(
      signUpForm({ confirmPassword: "Supper124" }),
      authResult({}),
    );

    assert.deepEqual(invalidEmail.calls, []);
    assert.equal(invalidEmail.state.status, "error");
    assert.equal(invalidEmail.state.message, "Enter a valid email.");
    assert.equal(invalidEmail.state.fieldErrors.email, "Enter a valid email.");
    assert.equal(invalidEmail.state.values.email, "not-an-email");
    assert.equal(invalidEmail.state.values.password, "");

    assert.deepEqual(weakPassword.calls, []);
    assert.equal(weakPassword.state.status, "error");
    assert.equal(weakPassword.state.message, "Include an uppercase letter.");
    assert.equal(
      weakPassword.state.fieldErrors.password,
      "Include an uppercase letter.",
    );

    assert.deepEqual(mismatch.calls, []);
    assert.equal(mismatch.state.status, "error");
    assert.equal(mismatch.state.message, "Passwords do not match.");
    assert.equal(
      mismatch.state.fieldErrors.confirmPassword,
      "Passwords do not match.",
    );
    assert.equal(mismatch.state.values.password, "");
    assert.equal(mismatch.state.values.confirmPassword, "");
  });

  test("keeps rate-limit and other auth errors distinct from confirmation", async () => {
    const emailRateLimit = await attempt(
      signUpForm(),
      authResult({
        error: {
          message: "email rate limit exceeded",
          code: "over_email_send_rate_limit",
          status: 429,
        },
      }),
    );
    const requestRateLimit = await attempt(
      signUpForm(),
      authResult({
        error: {
          message: "Request rate limit reached",
          code: "over_request_rate_limit",
          status: 429,
        },
      }),
    );
    const weakPassword = await attempt(
      signUpForm(),
      authResult({
        error: {
          message: "Password should be at least 6 characters.",
          code: "weak_password",
          status: 422,
        },
      }),
    );
    const signupsDisabled = await attempt(
      signUpForm(),
      authResult({
        error: {
          message: "Signups not allowed for this instance",
          code: "signup_disabled",
          status: 422,
        },
      }),
    );

    const rateLimitState = {
      status: "error",
      message: "Too many attempts. Wait a little and try again.",
      fieldErrors: {},
      values: {
        name,
        email,
        password: "",
        confirmPassword: "",
      },
    };

    assert.deepEqual(emailRateLimit.state, rateLimitState);
    assert.deepEqual(requestRateLimit.state, rateLimitState);
    assert.deepEqual(emailRateLimit.calls, [registeredCredentials]);
    assert.equal(weakPassword.state.status, "error");
    assert.equal(
      weakPassword.state.message,
      "Something went wrong. Try again.",
    );
    assert.notDeepEqual(weakPassword.state, confirmationState);
    assert.equal(signupsDisabled.state.status, "error");
    assert.equal(
      signupsDisabled.state.message,
      "Something went wrong. Try again.",
    );
    assert.notDeepEqual(signupsDisabled.state, confirmationState);
  });

  test("does not store a sign-up session in cookies", () => {
    assert.deepEqual(signUpAuthOptions, {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    });
  });
});
