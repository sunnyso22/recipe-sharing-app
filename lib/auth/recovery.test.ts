import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import { describe, test } from "bun:test";

import {
  clearPasswordRecoveryCookie,
  encodePasswordRecoveryCookie,
  hasPasswordRecoveryCookie,
  isRecoveryUserId,
  passwordRecoveryCookieMatches,
  passwordRecoveryCookieName,
  passwordRecoveryCookieSecretName,
  readPasswordRecoveryCookieSecret,
  type RecoveryCookieOptions,
  recoveryCookieOptions,
  type RecoverySecretEnv,
  recoverySecretFailureMessage,
  rememberPasswordRecovery,
} from "@/lib/auth/recovery-cookie";

const userId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "22222222-2222-4222-8222-222222222222";
const now = 1_700_000_000_000;

const validSecret = () => {
  const secret = randomBytes(32).toString("base64");
  const read = readPasswordRecoveryCookieSecret({
    PASSWORD_RECOVERY_COOKIE_SECRET: secret,
  });

  if (!read.ok) {
    throw new Error("The test secret was rejected.");
  }

  return secret;
};

const secretEnv = (
  secret: string | undefined,
  databaseUrl?: string,
): RecoverySecretEnv => {
  return {
    PASSWORD_RECOVERY_COOKIE_SECRET: secret,
    DATABASE_URL: databaseUrl,
  };
};

const cookieJar = () => {
  const entries = new Map<
    string,
    { value: string; options: RecoveryCookieOptions }
  >();

  return {
    get: (name: string) => {
      const entry = entries.get(name);
      return entry ? { value: entry.value } : undefined;
    },
    set: (name: string, value: string, options: RecoveryCookieOptions) => {
      entries.set(name, { value, options });
    },
    peek: (name: string) => entries.get(name),
    tamper: (name: string, next: (value: string) => string) => {
      const entry = entries.get(name);

      if (!entry) {
        throw new Error("The recovery cookie was not written.");
      }

      entry.value = next(entry.value);
    },
  };
};

const assertMessageHides = (message: string, hidden: string[]) => {
  for (const value of hidden) {
    if (value.length > 0 && message.includes(value)) {
      throw new Error("A recovery error included a configured value.");
    }
  }
};

describe("password recovery cookie secret", () => {
  test("keeps a server-only name", () => {
    assert.equal(
      passwordRecoveryCookieSecretName,
      "PASSWORD_RECOVERY_COOKIE_SECRET",
    );
    assert.equal(
      passwordRecoveryCookieSecretName.startsWith("NEXT_PUBLIC_"),
      false,
    );
  });

  test("accepts 32-byte base64 and hex keys", () => {
    const base64 = validSecret();
    const hex = randomBytes(32).toString("hex");
    const base64Read = readPasswordRecoveryCookieSecret(secretEnv(base64));
    const hexRead = readPasswordRecoveryCookieSecret(secretEnv(hex));

    assert.equal(base64Read.ok, true);
    assert.equal(hexRead.ok, true);
  });

  test("trims surrounding whitespace and signs with the trimmed value", () => {
    const secret = validSecret();
    const read = readPasswordRecoveryCookieSecret(
      secretEnv(`\n${secret}\n`),
    );

    if (!read.ok || read.secret !== secret) {
      throw new Error("The recovery secret was not the trimmed value.");
    }

    const cookie = encodePasswordRecoveryCookie(userId, now, read.secret);

    assert.equal(
      passwordRecoveryCookieMatches(cookie, userId, secret, now),
      true,
    );
    assert.equal(
      passwordRecoveryCookieMatches(cookie, userId, `\n${secret}\n`, now),
      false,
    );
  });

  test("fails closed when the variable is missing or blank", () => {
    for (const secret of [undefined, "", "   \n\t"]) {
      const read = readPasswordRecoveryCookieSecret(secretEnv(secret));

      assert.deepEqual(read, { ok: false, reason: "missing" });
    }

    assert.equal(
      recoverySecretFailureMessage("missing"),
      "PASSWORD_RECOVERY_COOKIE_SECRET is not set, so the recovery cookie cannot be signed.",
    );
  });

  test("rejects short, repetitive, spaced, and oversized values", () => {
    const cases = [
      "short-secret",
      randomBytes(30).toString("base64"),
      randomBytes(16).toString("hex"),
      "a".repeat(64),
      "password".repeat(8),
      "0123456789abcdef".repeat(4),
      `secret ${validSecret()}`,
      randomBytes(193).toString("base64"),
    ];

    for (const secret of cases) {
      const read = readPasswordRecoveryCookieSecret(secretEnv(secret));

      assert.deepEqual(read, { ok: false, reason: "invalid" });
      assertMessageHides(recoverySecretFailureMessage("invalid"), [secret]);
    }

    assert.equal(
      recoverySecretFailureMessage("invalid"),
      "PASSWORD_RECOVERY_COOKIE_SECRET is invalid, so the recovery cookie cannot be signed.",
    );
  });

  test("rejects a database URL and a copy of DATABASE_URL", () => {
    const body = randomBytes(32).toString("base64url");
    const databaseUrl = `postgresql://postgres:${body}@db.example:5432/postgres`;
    const copied = validSecret();
    const urlRead = readPasswordRecoveryCookieSecret({
      PASSWORD_RECOVERY_COOKIE_SECRET: databaseUrl,
      DATABASE_URL: "postgresql://other.example/app",
    });
    const copiedRead = readPasswordRecoveryCookieSecret({
      PASSWORD_RECOVERY_COOKIE_SECRET: copied,
      DATABASE_URL: copied,
    });
    const separated = readPasswordRecoveryCookieSecret({
      PASSWORD_RECOVERY_COOKIE_SECRET: copied,
      DATABASE_URL: databaseUrl,
    });

    assert.deepEqual(urlRead, { ok: false, reason: "invalid" });
    assert.deepEqual(copiedRead, { ok: false, reason: "invalid" });
    assert.equal(separated.ok, true);
    assert.equal(
      readPasswordRecoveryCookieSecret(secretEnv(body)).ok,
      true,
    );
    assertMessageHides(recoverySecretFailureMessage("invalid"), [
      databaseUrl,
      copied,
      body,
    ]);
  });

  test("does not fall back to DATABASE_URL", () => {
    const databaseUrl = validSecret();
    const read = readPasswordRecoveryCookieSecret({
      DATABASE_URL: databaseUrl,
    });
    const store = cookieJar();
    const forged = encodePasswordRecoveryCookie(
      userId,
      now + 60 * 60 * 1000,
      databaseUrl,
    );

    store.set(passwordRecoveryCookieName, forged, recoveryCookieOptions("test"));

    assert.deepEqual(read, { ok: false, reason: "missing" });
    assert.equal(
      hasPasswordRecoveryCookie(userId, store, { DATABASE_URL: databaseUrl }, now),
      false,
    );
    assert.equal(read.ok, false);
  });
});

describe("password recovery cookie", () => {
  test("verifies a cookie signed with the configured key", () => {
    const secret = validSecret();
    const store = cookieJar();

    assert.equal(
      rememberPasswordRecovery(userId, store, secretEnv(secret), now, "test"),
      true,
    );

    const written = store.peek(passwordRecoveryCookieName);

    if (!written?.value.startsWith(`${userId}.`)) {
      throw new Error("The recovery cookie was not bound to the user.");
    }

    const signature = written.value.slice(written.value.lastIndexOf(".") + 1);

    assert.equal(signature.length, 43);
    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(secret), now),
      true,
    );
    assert.equal(
      passwordRecoveryCookieMatches(written.value, userId, secret, now),
      true,
    );
  });

  test("rejects a cookie signed with a different key", () => {
    const secret = validSecret();
    const other = validSecret();
    const store = cookieJar();

    rememberPasswordRecovery(userId, store, secretEnv(secret), now, "test");

    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(other), now),
      false,
    );

    if (secret === other) {
      throw new Error("The two test keys were the same.");
    }
  });

  test("rejects tampered user, expiry, and signature", () => {
    const secret = validSecret();
    const expiresAt = now + 60 * 60 * 1000;
    const cookie = encodePasswordRecoveryCookie(userId, expiresAt, secret);
    const signature = cookie.slice(cookie.lastIndexOf(".") + 1);
    const flipped = signature.endsWith("a")
      ? `${signature.slice(0, -1)}b`
      : `${signature.slice(0, -1)}a`;
    const shortened = signature.slice(0, -4);

    assert.equal(
      passwordRecoveryCookieMatches(
        `${otherUserId}.${expiresAt}.${signature}`,
        userId,
        secret,
        now,
      ),
      false,
    );
    assert.equal(
      passwordRecoveryCookieMatches(
        `${userId}.${expiresAt + 1}.${signature}`,
        userId,
        secret,
        now,
      ),
      false,
    );
    assert.equal(
      passwordRecoveryCookieMatches(
        `${userId}.${expiresAt}.${flipped}`,
        userId,
        secret,
        now,
      ),
      false,
    );
    assert.equal(
      passwordRecoveryCookieMatches(
        `${userId}.${expiresAt}.${shortened}`,
        userId,
        secret,
        now,
      ),
      false,
    );
    assert.equal(passwordRecoveryCookieMatches("not-a-cookie", userId, secret, now), false);
    assert.equal(
      passwordRecoveryCookieMatches(`${userId}.soon.${signature}`, userId, secret, now),
      false,
    );
  });

  test("rejects an expired cookie and accepts the exact expiry", () => {
    const secret = validSecret();
    const expiresAt = now + 60 * 60 * 1000;
    const cookie = encodePasswordRecoveryCookie(userId, expiresAt, secret);

    assert.equal(
      passwordRecoveryCookieMatches(cookie, userId, secret, expiresAt),
      true,
    );
    assert.equal(
      passwordRecoveryCookieMatches(cookie, userId, secret, expiresAt + 1),
      false,
    );
  });

  test("rejects a cookie bound to another user", () => {
    const secret = validSecret();
    const store = cookieJar();

    rememberPasswordRecovery(userId, store, secretEnv(secret), now, "development");

    assert.equal(
      hasPasswordRecoveryCookie(otherUserId, store, secretEnv(secret), now),
      false,
    );
    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(secret), now),
      true,
    );
  });

  test("keeps httpOnly, SameSite, Secure, path, and max age", () => {
    const secret = validSecret();
    const production = cookieJar();
    const development = cookieJar();

    rememberPasswordRecovery(
      userId,
      production,
      secretEnv(secret),
      now,
      "production",
    );
    rememberPasswordRecovery(
      userId,
      development,
      secretEnv(secret),
      now,
      "development",
    );

    assert.deepEqual(production.peek(passwordRecoveryCookieName)?.options, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/reset-password",
      maxAge: 60 * 60,
    });
    assert.equal(
      development.peek(passwordRecoveryCookieName)?.options.secure,
      false,
    );
    assert.equal(passwordRecoveryCookieName, "password-recovery");
    assert.deepEqual(recoveryCookieOptions("test"), {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/reset-password",
      maxAge: 60 * 60,
    });
  });

  test("refuses to bind an empty or dotted user id", () => {
    const secret = validSecret();
    const store = cookieJar();

    assert.equal(isRecoveryUserId(userId), true);
    assert.equal(isRecoveryUserId(""), false);
    assert.equal(isRecoveryUserId("user.id"), false);
    assert.equal(isRecoveryUserId("."), false);
    assert.equal(isRecoveryUserId(null), false);

    for (const candidate of ["", "user.id", null, undefined, 12]) {
      assert.equal(
        rememberPasswordRecovery(
          candidate,
          store,
          secretEnv(secret),
          now,
          "test",
        ),
        false,
      );
    }

    assert.equal(store.peek(passwordRecoveryCookieName), undefined);
  });

  test("rotation invalidates the existing cookie until a fresh one is issued", () => {
    const current = validSecret();
    const rotated = validSecret();
    const store = cookieJar();

    rememberPasswordRecovery(userId, store, secretEnv(current), now, "production");

    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(current), now),
      true,
    );
    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(rotated), now),
      false,
    );

    rememberPasswordRecovery(userId, store, secretEnv(rotated), now, "production");

    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(rotated), now),
      true,
    );
    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(current), now),
      false,
    );
  });

  test("clear drops the value and keeps the other cookie flags", () => {
    const secret = validSecret();
    const store = cookieJar();

    rememberPasswordRecovery(
      userId,
      store,
      secretEnv(secret),
      now,
      "production",
    );
    clearPasswordRecoveryCookie(store, "production");

    assert.deepEqual(store.peek(passwordRecoveryCookieName), {
      value: "",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/reset-password",
        maxAge: 0,
      },
    });
    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(secret), now),
      false,
    );
  });

  test("does not write or honour a cookie when configuration is missing or invalid", () => {
    const secret = validSecret();
    const store = cookieJar();
    const weak = "password".repeat(8);
    const databaseUrl = validSecret();

    rememberPasswordRecovery(userId, store, secretEnv(secret), now, "test");
    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(secret), now),
      true,
    );
    assert.equal(
      hasPasswordRecoveryCookie(userId, store, secretEnv(undefined), now),
      false,
    );
    assert.equal(
      hasPasswordRecoveryCookie(
        userId,
        store,
        secretEnv(weak, databaseUrl),
        now,
      ),
      false,
    );

    const empty = cookieJar();

    assert.throws(
      () =>
        rememberPasswordRecovery(userId, empty, secretEnv(undefined), now, "test"),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, recoverySecretFailureMessage("missing"));
        assertMessageHides(error.message, [databaseUrl]);
        return true;
      },
    );
    assert.equal(empty.peek(passwordRecoveryCookieName), undefined);

    assert.throws(
      () =>
        rememberPasswordRecovery(
          userId,
          empty,
          secretEnv(weak, databaseUrl),
          now,
          "test",
        ),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, recoverySecretFailureMessage("invalid"));
        assertMessageHides(error.message, [weak, databaseUrl]);
        return true;
      },
    );
    assert.equal(empty.peek(passwordRecoveryCookieName), undefined);
    assert.equal(
      hasPasswordRecoveryCookie(userId, empty, secretEnv(weak, databaseUrl), now),
      false,
    );
  });
});
