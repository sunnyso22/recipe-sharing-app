const confirmErrorPath = "/login?error=confirm";
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
  forgotPasswordPath,
  recoveryErrorPath,
  resetPasswordPath,
  safeNextPath,
};
