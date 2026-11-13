import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const recoveryCookieName = "password-recovery";

const recoveryCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/reset-password",
  maxAge: 60 * 60,
};

const recoverySecret = () => {
  const secret = process.env.DATABASE_URL;
  return secret && secret.length > 0 ? secret : null;
};

const signRecoveryPayload = (payload: string) => {
  const secret = recoverySecret();

  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
};

const setPasswordRecoveryCookie = async (userId: string) => {
  const expiresAt = Date.now() + recoveryCookieOptions.maxAge * 1000;
  const payload = `${userId}.${expiresAt}`;
  const signature = signRecoveryPayload(payload);

  if (!signature) {
    throw new Error("DATABASE_URL is required to sign the recovery cookie.");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    recoveryCookieName,
    `${payload}.${signature}`,
    recoveryCookieOptions,
  );
};

const hasPasswordRecoveryCookie = async (userId: string) => {
  const cookieStore = await cookies();
  const value = cookieStore.get(recoveryCookieName)?.value;

  if (!value) {
    return false;
  }

  const separator = value.lastIndexOf(".");
  const issuedAtSeparator = value.lastIndexOf(".", separator - 1);

  if (separator <= 0 || issuedAtSeparator <= 0) {
    return false;
  }

  const cookieUserId = value.slice(0, issuedAtSeparator);
  const expiresAtRaw = value.slice(issuedAtSeparator + 1, separator);
  const signature = value.slice(separator + 1);
  const expected = signRecoveryPayload(`${cookieUserId}.${expiresAtRaw}`);

  if (!expected || !/^\d+$/.test(expiresAtRaw)) {
    return false;
  }

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return false;
  }

  if (Number(expiresAtRaw) < Date.now()) {
    return false;
  }

  return cookieUserId === userId;
};

const clearPasswordRecoveryCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(recoveryCookieName, "", {
    ...recoveryCookieOptions,
    maxAge: 0,
  });
};

const rememberPasswordRecovery = async (userId: unknown) => {
  if (typeof userId !== "string" || userId.length === 0 || userId.includes(".")) {
    return false;
  }

  await setPasswordRecoveryCookie(userId);
  return true;
};

export {
  clearPasswordRecoveryCookie,
  hasPasswordRecoveryCookie,
  rememberPasswordRecovery,
  setPasswordRecoveryCookie,
};
