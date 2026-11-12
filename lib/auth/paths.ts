const confirmErrorPath = "/login?error=confirm";
const expiredResetMessage =
  "That reset link is invalid or has expired. Request a new one.";
const forgotPasswordPath = "/forgot-password";
const resetPasswordPath = "/reset-password";
const recoveryErrorPath = "/forgot-password?error=expired";

const safeNextPath = (value: string | null) => {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }

  return value;
};

export {
  confirmErrorPath,
  expiredResetMessage,
  forgotPasswordPath,
  recoveryErrorPath,
  resetPasswordPath,
  safeNextPath,
};
