import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import { authErrorMessage } from "@/lib/auth/form";
import { completeSignIn, type SignInDeps } from "@/lib/auth/sign-in";

const email = "ada@example.com";
const password = "Supper123";

const signInFailureMessage = "Email or password is incorrect.";

const failureState = {
  status: "error",
  message: signInFailureMessage,
  fieldErrors: {},
  values: {
    name: "",
    email,
    password: "",
    confirmPassword: "",
  },
};

const signInForm = (fields?: {
  email?: string;
  password?: string;
  next?: string;
}) => {
  const formData = new FormData();
  formData.set("email", fields?.email ?? email);
  formData.set("password", fields?.password ?? password);

  if (fields && "next" in fields && fields.next !== undefined) {
    formData.set("next", fields.next);
  }

  return formData;
};

const attempt = async (
  formData: FormData,
  error: { message: string; code?: string | null } | null,
) => {
  const calls: Parameters<SignInDeps["signInWithPassword"]>[0][] = [];
  const result = await completeSignIn(formData, {
    signInWithPassword: async (credentials) => {
      calls.push(credentials);
      return { error };
    },
  });

  return { result, calls };
};

describe("sign in", () => {
  test("uses one message for account-status failures", async () => {
    const failures = [
      { message: "Invalid login credentials", code: "invalid_credentials" },
      { message: "Invalid login credentials" },
      { message: "Email not confirmed", code: "email_not_confirmed" },
      { message: "Email not confirmed" },
      { message: "Phone not confirmed", code: "phone_not_confirmed" },
      { message: "User is banned", code: "user_banned" },
      { message: "User is banned" },
      { message: "User not found", code: "user_not_found" },
      { message: "Account is locked", code: "invalid_credentials" },
      { message: "Use your organisation sign-in", code: "user_sso_managed" },
    ];

    assert.notEqual(
      signInFailureMessage,
      authErrorMessage("Email not confirmed"),
    );
    assert.notEqual(signInFailureMessage, authErrorMessage("User is banned"));

    for (const error of failures) {
      const { result, calls } = await attempt(signInForm(), error);

      assert.deepEqual(result, { status: "error", state: failureState });
      assert.deepEqual(calls, [{ email, password }]);
    }
  });

  test("keeps invalid email and empty password errors", async () => {
    const invalidEmail = await attempt(
      signInForm({ email: "not-an-email" }),
      null,
    );
    const emptyPassword = await attempt(signInForm({ password: "" }), null);
    const longPassword = await attempt(
      signInForm({ password: "a".repeat(129) }),
      null,
    );

    assert.deepEqual(invalidEmail.calls, []);
    assert.equal(invalidEmail.result.status, "error");
    if (invalidEmail.result.status === "error") {
      assert.equal(invalidEmail.result.state.message, "Enter a valid email.");
      assert.equal(
        invalidEmail.result.state.fieldErrors.email,
        "Enter a valid email.",
      );
      assert.equal(invalidEmail.result.state.values.email, "not-an-email");
      assert.equal(invalidEmail.result.state.values.password, "");
    }

    assert.deepEqual(emptyPassword.calls, []);
    assert.equal(emptyPassword.result.status, "error");
    if (emptyPassword.result.status === "error") {
      assert.equal(emptyPassword.result.state.message, "Enter your password.");
      assert.equal(
        emptyPassword.result.state.fieldErrors.password,
        "Enter your password.",
      );
    }

    assert.deepEqual(longPassword.calls, []);
    assert.equal(longPassword.result.status, "error");
    if (longPassword.result.status === "error") {
      assert.equal(
        longPassword.result.state.message,
        "Use 128 characters or fewer.",
      );
    }
  });

  test("keeps rate-limit and non-account failures distinct", async () => {
    const rateLimits = [
      { message: "Request rate limit reached", code: "over_request_rate_limit" },
      { message: "email rate limit exceeded", code: "over_email_send_rate_limit" },
      { message: "SMS rate limit exceeded", code: "over_sms_send_rate_limit" },
      { message: "Request rate limit reached" },
      {
        message: "For security purposes, you can only request this after 60 seconds.",
        code: "over_request_rate_limit",
      },
    ];
    const unexpected = [
      { message: "Email logins are disabled", code: "email_provider_disabled" },
      { message: "Database error querying schema", code: "unexpected_failure" },
      { message: "Request timeout", code: "request_timeout" },
      {
        message: "captcha protection verification failed",
        code: "captcha_failed",
      },
      { message: "Auth session or user missing" },
    ];

    for (const error of rateLimits) {
      const { result } = await attempt(signInForm(), error);

      assert.equal(result.status, "error");
      if (result.status === "error") {
        assert.equal(
          result.state.message,
          "Too many attempts. Wait a little and try again.",
        );
        assert.equal(result.state.values.password, "");
        assert.notEqual(result.state.message, signInFailureMessage);
      }
    }

    for (const error of unexpected) {
      const { result } = await attempt(signInForm(), error);

      assert.equal(result.status, "error");
      if (result.status === "error") {
        assert.equal(result.state.message, "Something went wrong. Try again.");
        assert.notEqual(result.state.message, signInFailureMessage);
      }
    }
  });

  test("redirects a signed-in person through safeNextPath", async () => {
    const home = await attempt(signInForm(), null);
    const cookbook = await attempt(signInForm({ next: "/cookbook" }), null);
    const external = await attempt(
      signInForm({ next: "https://evil.example/login" }),
      null,
    );
    const protocolRelative = await attempt(
      signInForm({ next: "//evil.example" }),
      null,
    );
    const backslash = await attempt(signInForm({ next: "/\\evil" }), null);

    assert.deepEqual(home.result, { status: "redirect", path: "/" });
    assert.deepEqual(cookbook.result, {
      status: "redirect",
      path: "/cookbook",
    });
    assert.deepEqual(cookbook.calls, [{ email, password }]);
    assert.deepEqual(external.result, { status: "redirect", path: "/" });
    assert.deepEqual(protocolRelative.result, {
      status: "redirect",
      path: "/",
    });
    assert.deepEqual(backslash.result, { status: "redirect", path: "/" });
  });
});
