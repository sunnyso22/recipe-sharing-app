import "server-only";

import { cookies } from "next/headers";

import {
  clearPasswordRecoveryCookie as clearStoredPasswordRecoveryCookie,
  hasPasswordRecoveryCookie as hasStoredPasswordRecoveryCookie,
  passwordRecoveryCookieSecretName,
  rememberPasswordRecovery as rememberStoredPasswordRecovery,
  setPasswordRecoveryCookie as setStoredPasswordRecoveryCookie,
} from "@/lib/auth/recovery-cookie";

const databaseUrlEnvName = "DATABASE_URL";

// DATABASE_URL is compared only so a pasted database URL is rejected.
// It is never the HMAC key, and there is no fallback to it.
const recoveryEnv = () => {
  return {
    PASSWORD_RECOVERY_COOKIE_SECRET:
      process.env[passwordRecoveryCookieSecretName],
    DATABASE_URL: process.env[databaseUrlEnvName],
  };
};

const setPasswordRecoveryCookie = async (userId: string) => {
  const cookieStore = await cookies();
  setStoredPasswordRecoveryCookie(
    userId,
    cookieStore,
    recoveryEnv(),
    Date.now(),
    process.env.NODE_ENV,
  );
};

const hasPasswordRecoveryCookie = async (userId: string) => {
  const cookieStore = await cookies();
  return hasStoredPasswordRecoveryCookie(
    userId,
    cookieStore,
    recoveryEnv(),
    Date.now(),
  );
};

const clearPasswordRecoveryCookie = async () => {
  const cookieStore = await cookies();
  clearStoredPasswordRecoveryCookie(cookieStore, process.env.NODE_ENV);
};

const rememberPasswordRecovery = async (userId: unknown) => {
  const cookieStore = await cookies();
  return rememberStoredPasswordRecovery(
    userId,
    cookieStore,
    recoveryEnv(),
    Date.now(),
    process.env.NODE_ENV,
  );
};

export {
  clearPasswordRecoveryCookie,
  hasPasswordRecoveryCookie,
  rememberPasswordRecovery,
  setPasswordRecoveryCookie,
};
