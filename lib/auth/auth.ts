import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";

import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import {
  consumeConfirmation,
  hasLiveConfirmation,
  saveConfirmation,
} from "@/lib/auth/confirmation-record";
import { confirmationUrl, resetUrl } from "@/lib/auth/origin";
import { deleteReset } from "@/lib/auth/reset-record";
import { sendConfirmation } from "@/lib/mail/send-confirmation";
import { sendReset } from "@/lib/mail/send-reset";

const requestHeaders = async (request?: Request) => {
  if (request) {
    return request.headers;
  }

  return new Headers(await headers());
};

const tokenFrom = (request?: Request) => {
  if (!request) {
    return null;
  }

  return new URL(request.url).searchParams.get("token");
};

const resendConfirmationIfExpired = async (
  existing: { id: string; email: string; emailVerified: boolean },
  request?: Request,
) => {
  if (existing.emailVerified || (await hasLiveConfirmation(existing.id))) {
    return;
  }

  await auth.api.sendVerificationEmail({
    body: {
      email: existing.email,
      callbackURL: "/",
    },
    headers: await requestHeaders(request),
  });
};

const auth = betterAuth({
  appName: "Cookery",
  ...(process.env.BETTER_AUTH_URL
    ? { baseURL: process.env.BETTER_AUTH_URL }
    : {}),
  ...(process.env.BETTER_AUTH_SECRET
    ? { secret: process.env.BETTER_AUTH_SECRET }
    : {}),
  trustedOrigins: [
    "https://cookery.sunnyso22.dev",
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.vercel.app",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 10,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user: accountUser, token }, request) => {
      if (!accountUser.emailVerified) {
        await deleteReset(token);
        return;
      }

      try {
        const url = await resetUrl(token, request);
        await sendReset({
          name: accountUser.name,
          to: accountUser.email,
          url,
        });
      } catch (error) {
        await deleteReset(token);
        throw error;
      }
    },
    onExistingUserSignUp: async ({ user: existing }, request) => {
      await resendConfirmationIfExpired(existing, request);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 10,
    sendVerificationEmail: async ({ user: accountUser, token }, request) => {
      const url = await confirmationUrl(token, request);
      await sendConfirmation({
        name: accountUser.name,
        to: accountUser.email,
        url,
      });
      await saveConfirmation(accountUser.id, token);
    },
    beforeEmailVerification: async (accountUser, request) => {
      const token = tokenFrom(request);
      const consumed = token
        ? await consumeConfirmation(accountUser.id, token)
        : false;

      if (!consumed) {
        throw new APIError("UNAUTHORIZED", {
          message: "This confirmation link is not live.",
        });
      }
    },
  },
  plugins: [nextCookies()],
});

export { auth };
