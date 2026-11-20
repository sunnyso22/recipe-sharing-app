import { createHmac, timingSafeEqual } from "node:crypto";

// Signing rules for the password-recovery cookie. lib/auth/recovery.ts is the
// server entry: it reads the environment and writes the httpOnly cookie.
const passwordRecoveryCookieSecretName = "PASSWORD_RECOVERY_COOKIE_SECRET";
const passwordRecoveryCookieName = "password-recovery";

const minimumSecretLength = 43;
const maximumSecretLength = 256;
const minimumSecretEntropyBits = 160;
const minimumDistinctCharacters = 10;
const recoveryCookieMaxAgeSeconds = 60 * 60;

type RecoverySecretEnv = {
  PASSWORD_RECOVERY_COOKIE_SECRET?: string;
  DATABASE_URL?: string;
};

type RecoverySecretResult =
  | { ok: true; secret: string }
  | { ok: false; reason: "missing" | "invalid" };

type RecoveryCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/reset-password";
  maxAge: number;
};

type RecoveryCookieStore = {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: RecoveryCookieOptions) => void;
};

const recoverySecretFailureMessage = (reason: "missing" | "invalid") => {
  if (reason === "missing") {
    return "PASSWORD_RECOVERY_COOKIE_SECRET is not set, so the recovery cookie cannot be signed.";
  }

  return "PASSWORD_RECOVERY_COOKIE_SECRET is invalid, so the recovery cookie cannot be signed.";
};

const estimatedEntropyBits = (value: string) => {
  const counts = new Map<string, number>();

  for (const character of value) {
    counts.set(character, (counts.get(character) ?? 0) + 1);
  }

  let bitsPerCharacter = 0;

  for (const count of counts.values()) {
    const probability = count / value.length;
    bitsPerCharacter -= probability * Math.log2(probability);
  }

  return bitsPerCharacter * value.length;
};

const repeatsABlock = (value: string) => {
  for (let period = 1; period <= value.length / 2; period += 1) {
    if (value.length % period !== 0) {
      continue;
    }

    const block = value.slice(0, period);

    if (block.repeat(value.length / period) === value) {
      return true;
    }
  }

  return false;
};

const looksLikeUrl = (value: string) => {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
};

const isDatabaseCredential = (value: string, databaseUrl: string | undefined) => {
  const configured = databaseUrl?.trim() ?? "";

  return looksLikeUrl(value) || (configured.length > 0 && value === configured);
};

const isAcceptableRecoverySecret = (
  secret: string,
  databaseUrl: string | undefined,
) => {
  if (
    secret.length < minimumSecretLength ||
    secret.length > maximumSecretLength ||
    /\s/u.test(secret) ||
    new Set(secret).size < minimumDistinctCharacters ||
    repeatsABlock(secret) ||
    isDatabaseCredential(secret, databaseUrl) ||
    estimatedEntropyBits(secret) < minimumSecretEntropyBits
  ) {
    return false;
  }

  return true;
};

const readPasswordRecoveryCookieSecret = (
  env: RecoverySecretEnv,
): RecoverySecretResult => {
  const raw = env.PASSWORD_RECOVERY_COOKIE_SECRET;

  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { ok: false, reason: "missing" };
  }

  const secret = raw.trim();

  if (!isAcceptableRecoverySecret(secret, env.DATABASE_URL)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, secret };
};

const recoveryCookieOptions = (
  nodeEnv: string | undefined,
): RecoveryCookieOptions => {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: nodeEnv === "production",
    path: "/reset-password",
    maxAge: recoveryCookieMaxAgeSeconds,
  };
};

const isRecoveryUserId = (userId: unknown): userId is string => {
  return (
    typeof userId === "string" && userId.length > 0 && !userId.includes(".")
  );
};

const encodePasswordRecoveryCookie = (
  userId: string,
  expiresAt: number,
  secret: string,
) => {
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
};

const passwordRecoveryCookieMatches = (
  value: string,
  userId: string,
  secret: string,
  now: number,
) => {
  const separator = value.lastIndexOf(".");
  const issuedAtSeparator = value.lastIndexOf(".", separator - 1);

  if (separator <= 0 || issuedAtSeparator <= 0) {
    return false;
  }

  const cookieUserId = value.slice(0, issuedAtSeparator);
  const expiresAtRaw = value.slice(issuedAtSeparator + 1, separator);
  const signature = value.slice(separator + 1);
  const expected = createHmac("sha256", secret)
    .update(`${cookieUserId}.${expiresAtRaw}`)
    .digest("base64url");

  if (!/^\d+$/.test(expiresAtRaw)) {
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

  if (Number(expiresAtRaw) < now) {
    return false;
  }

  return cookieUserId === userId;
};

const setPasswordRecoveryCookie = (
  userId: string,
  store: RecoveryCookieStore,
  env: RecoverySecretEnv,
  now: number,
  nodeEnv: string | undefined,
) => {
  const read = readPasswordRecoveryCookieSecret(env);

  if (!read.ok) {
    throw new Error(recoverySecretFailureMessage(read.reason));
  }

  const options = recoveryCookieOptions(nodeEnv);
  store.set(
    passwordRecoveryCookieName,
    encodePasswordRecoveryCookie(
      userId,
      now + options.maxAge * 1000,
      read.secret,
    ),
    options,
  );
};

const hasPasswordRecoveryCookie = (
  userId: string,
  store: RecoveryCookieStore,
  env: RecoverySecretEnv,
  now: number,
) => {
  const read = readPasswordRecoveryCookieSecret(env);

  if (!read.ok) {
    return false;
  }

  const value = store.get(passwordRecoveryCookieName)?.value;

  if (!value) {
    return false;
  }

  return passwordRecoveryCookieMatches(value, userId, read.secret, now);
};

const clearPasswordRecoveryCookie = (
  store: RecoveryCookieStore,
  nodeEnv: string | undefined,
) => {
  store.set(passwordRecoveryCookieName, "", {
    ...recoveryCookieOptions(nodeEnv),
    maxAge: 0,
  });
};

const rememberPasswordRecovery = (
  userId: unknown,
  store: RecoveryCookieStore,
  env: RecoverySecretEnv,
  now: number,
  nodeEnv: string | undefined,
) => {
  if (!isRecoveryUserId(userId)) {
    return false;
  }

  setPasswordRecoveryCookie(userId, store, env, now, nodeEnv);
  return true;
};

export {
  clearPasswordRecoveryCookie,
  encodePasswordRecoveryCookie,
  hasPasswordRecoveryCookie,
  isRecoveryUserId,
  passwordRecoveryCookieMatches,
  passwordRecoveryCookieName,
  passwordRecoveryCookieSecretName,
  readPasswordRecoveryCookieSecret,
  recoveryCookieOptions,
  recoverySecretFailureMessage,
  rememberPasswordRecovery,
  setPasswordRecoveryCookie,
};
export type { RecoveryCookieOptions, RecoveryCookieStore, RecoverySecretEnv };
