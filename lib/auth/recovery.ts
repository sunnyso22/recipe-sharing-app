import { cookies } from "next/headers";

const recoveryCookieName = "password-recovery";

const recoveryCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/reset-password",
  maxAge: 60 * 60,
};

const setPasswordRecoveryCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(recoveryCookieName, "1", recoveryCookieOptions);
};

const hasPasswordRecoveryCookie = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(recoveryCookieName)?.value === "1";
};

const clearPasswordRecoveryCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(recoveryCookieName, "", {
    ...recoveryCookieOptions,
    maxAge: 0,
  });
};

export {
  clearPasswordRecoveryCookie,
  hasPasswordRecoveryCookie,
  setPasswordRecoveryCookie,
};
