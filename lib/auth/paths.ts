const confirmErrorPath = "/login?error=confirm";

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

export { confirmErrorPath, safeNextPath };
