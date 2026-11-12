const confirmErrorPath = "/login?error=confirm";
const expiredResetMessage =
  "That reset link is invalid or has expired. Request a new one.";
const forgotPasswordPath = "/forgot-password";
const resetPasswordPath = "/reset-password";
const recoveryErrorPath = "/forgot-password?error=expired";

const safeNextPath = (value: string | null) => {
  if (!value || value.length > 2048) {
    return "/";
  }

  const candidate = value.trim();

  if (
    candidate.length === 0 ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(candidate)
  ) {
    return "/";
  }

  let url: URL;

  try {
    url = new URL(candidate, "http://localhost");
  } catch {
    return "/";
  }

  let decodedPathname: string;

  try {
    decodedPathname = decodeURIComponent(url.pathname);
  } catch {
    return "/";
  }

  if (
    url.origin !== "http://localhost" ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    !decodedPathname.startsWith("/") ||
    decodedPathname.startsWith("//") ||
    decodedPathname.includes("\\") ||
    decodedPathname.includes("://") ||
    /[\u0000-\u001F\u007F]/.test(decodedPathname)
  ) {
    return "/";
  }

  return `${url.pathname}${url.search}${url.hash}`;
};

export {
  confirmErrorPath,
  expiredResetMessage,
  forgotPasswordPath,
  recoveryErrorPath,
  resetPasswordPath,
  safeNextPath,
};
