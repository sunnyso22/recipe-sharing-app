import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import {
  confirmAndDeleteAccount,
  type DeleteAccountDeps,
} from "@/lib/settings/delete-account";
import { deleteAccountSchema } from "@/lib/settings/form";

const userId = "3f1a9c2e-7b44-4d1a-9c3e-6a8b0d2e4f17";
const email = "cook@example.com";
const password = "correct-horse";

type SignIn = DeleteAccountDeps["signInWithPassword"];

const recorder = (
  signIn: SignIn,
  hooks?: {
    onSignOut?: DeleteAccountDeps["signOut"];
    onDelete?: DeleteAccountDeps["deleteUserAccount"];
  },
) => {
  const events: string[] = [];
  const signIns: { email: string; password: string }[] = [];
  const deleted: string[] = [];

  const deps: DeleteAccountDeps = {
    signInWithPassword: async (credentials) => {
      events.push("sign-in");
      signIns.push(credentials);
      return signIn(credentials);
    },
    signOut: async (options) => {
      events.push(`sign-out:${options.scope}`);

      if (hooks?.onSignOut) {
        return hooks.onSignOut(options);
      }

      return { error: null };
    },
    deleteUserAccount: async (id) => {
      events.push("delete");
      deleted.push(id);

      if (hooks?.onDelete) {
        await hooks.onDelete(id);
      }
    },
  };

  return { deps, events, signIns, deleted };
};

const signedInAs = (id: string): SignIn => {
  return async () => {
    return { error: null, userId: id };
  };
};

const wrongPassword: SignIn = async () => {
  return { error: { message: "Invalid login credentials" }, userId: null };
};

const attempt = (
  input: { userId?: string; email?: string; password: string },
  signIn: SignIn,
  hooks?: {
    onSignOut?: DeleteAccountDeps["signOut"];
    onDelete?: DeleteAccountDeps["deleteUserAccount"];
  },
) => {
  const recorded = recorder(signIn, hooks);

  const result = confirmAndDeleteAccount(
    {
      userId: input.userId ?? userId,
      email: input.email ?? email,
      password: input.password,
    },
    recorded.deps,
  );

  return { ...recorded, result };
};

describe("delete account confirmation", () => {
  test("requires a password rather than the account email", () => {
    const emailOnly = deleteAccountSchema.safeParse({ email });
    assert.equal(emailOnly.success, false);

    const confirmed = deleteAccountSchema.safeParse({
      password,
      email,
    });
    assert.equal(confirmed.success, true);

    if (confirmed.success) {
      assert.deepEqual(confirmed.data, { password });
    }
  });

  test("does not delete when the password is missing", async () => {
    const { result, events, deleted } = attempt(
      { password: "" },
      signedInAs(userId),
    );

    assert.deepEqual(await result, {
      status: "invalid",
      message: "Enter your password.",
    });
    assert.deepEqual(events, []);
    assert.deepEqual(deleted, []);
  });

  test("does not delete when the password is too long", async () => {
    const { result, events, deleted } = attempt(
      { password: "a".repeat(129) },
      signedInAs(userId),
    );

    assert.deepEqual(await result, {
      status: "invalid",
      message: "Use 128 characters or fewer.",
    });
    assert.deepEqual(events, []);
    assert.deepEqual(deleted, []);
  });

  test("does not delete or sign out when the password is wrong", async () => {
    const { result, events, signIns, deleted } = attempt(
      { password: email },
      wrongPassword,
    );

    assert.deepEqual(await result, { status: "incorrect-password" });
    assert.deepEqual(signIns, [{ email, password: email }]);
    assert.deepEqual(events, ["sign-in"]);
    assert.deepEqual(deleted, []);
  });

  test("does not delete when password verification throws", async () => {
    const { result, events, deleted } = attempt({ password }, async () => {
      throw new Error("network");
    });

    await assert.rejects(result, /network/);
    assert.deepEqual(events, ["sign-in"]);
    assert.deepEqual(deleted, []);
  });

  test("does not delete when re-authentication returns a different user", async () => {
    const { result, events, deleted } = attempt(
      { password },
      signedInAs("8c0e1a22-6b5d-4f0a-9d3c-1e7b4a9c2d55"),
    );

    assert.deepEqual(await result, { status: "incorrect-password" });
    assert.deepEqual(events, ["sign-in"]);
    assert.deepEqual(deleted, []);
  });

  test("does not delete when the auth user id is not a uuid", async () => {
    const { result, events, deleted } = attempt(
      { userId: "Ada Lovelace", password },
      signedInAs(userId),
    );

    assert.deepEqual(await result, { status: "delete-failed" });
    assert.deepEqual(events, []);
    assert.deepEqual(deleted, []);
  });

  test("signs out before deleting the authenticated user id", async () => {
    const { result, events, signIns, deleted } = attempt(
      { password: ` ${password} ` },
      signedInAs(userId.toUpperCase()),
    );

    assert.deepEqual(await result, { status: "deleted" });
    assert.deepEqual(signIns, [{ email, password: ` ${password} ` }]);
    assert.deepEqual(events, ["sign-in", "sign-out:global", "delete"]);
    assert.deepEqual(deleted, [userId]);
  });

  test("falls back to a local sign-out and still deletes", async () => {
    const { result, events, deleted } = attempt({ password }, signedInAs(userId), {
      onSignOut: async (options) => {
        if (options.scope === "global") {
          return { error: { message: "global sign-out failed" } };
        }

        return { error: null };
      },
    });

    assert.deepEqual(await result, { status: "deleted" });
    assert.deepEqual(events, [
      "sign-in",
      "sign-out:global",
      "sign-out:local",
      "delete",
    ]);
    assert.deepEqual(deleted, [userId]);
  });

  test("still deletes when global sign-out throws and local sign-out succeeds", async () => {
    const { result, events, deleted } = attempt({ password }, signedInAs(userId), {
      onSignOut: async (options) => {
        if (options.scope === "global") {
          throw new Error("global sign-out threw");
        }

        return { error: null };
      },
    });

    assert.deepEqual(await result, { status: "deleted" });
    assert.deepEqual(events, [
      "sign-in",
      "sign-out:global",
      "sign-out:local",
      "delete",
    ]);
    assert.deepEqual(deleted, [userId]);
  });

  test("still deletes when both sign-outs throw", async () => {
    const { result, events, deleted } = attempt({ password }, signedInAs(userId), {
      onSignOut: async () => {
        throw new Error("sign-out threw");
      },
    });

    assert.deepEqual(await result, { status: "deleted" });
    assert.deepEqual(events, [
      "sign-in",
      "sign-out:global",
      "sign-out:local",
      "delete",
    ]);
    assert.deepEqual(deleted, [userId]);
  });

  test("does not report success when deletion fails after sign-out", async () => {
    const { result, events, deleted } = attempt({ password }, signedInAs(userId), {
      onDelete: async () => {
        throw new Error("database");
      },
    });

    assert.deepEqual(await result, { status: "delete-failed" });
    assert.deepEqual(events, ["sign-in", "sign-out:global", "delete"]);
    assert.deepEqual(deleted, [userId]);
  });
});
