import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import { authErrorMessage } from "@/lib/auth/form";

describe("shared auth error copy", () => {
  test("keeps recovery and settings messages", () => {
    assert.equal(
      authErrorMessage("Invalid login credentials"),
      "Email or password is incorrect.",
    );
    assert.equal(
      authErrorMessage("Email not confirmed"),
      "Confirm your email before signing in.",
    );
    assert.equal(
      authErrorMessage("email rate limit exceeded"),
      "Too many attempts. Wait a little and try again.",
    );
    assert.equal(
      authErrorMessage("New password should be different from the old password."),
      "Choose a password that is different from the current one.",
    );
    assert.equal(
      authErrorMessage("User is banned"),
      "Something went wrong. Try again.",
    );
    assert.equal(
      authErrorMessage("Database error querying schema"),
      "Something went wrong. Try again.",
    );
  });
});
