import type * as z from "zod";

const formFallbackMessage = "Check the form and try again.";

const firstIssueMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? formFallbackMessage;
};

const readFormString = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

export { firstIssueMessage, formFallbackMessage, readFormString };
