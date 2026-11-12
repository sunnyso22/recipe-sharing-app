import * as z from "zod";

import { firstIssueMessage } from "@/lib/forms";

const TEXT_LIMIT = 255;
const DESCRIPTION_LIMIT = 5000;
const INSTRUCTION_LIMIT = 2000;
const LIST_LIMIT = 50;

const limitedText = (emptyMessage: string) => {
  return z
    .string()
    .trim()
    .min(1, emptyMessage)
    .max(TEXT_LIMIT, "Use 255 characters or fewer.");
};

const quantitySchema = (emptyName: string) => {
  return z.object({
    name: limitedText(emptyName),
    quantity: limitedText("Enter a quantity."),
  });
};

const emptyQuantity = () => {
  return { name: "", quantity: "" };
};

const emptyInstruction = () => {
  return { description: "" };
};

const ingredientsSchema = quantitySchema("Enter a ingredient.");
const seasoningsSchema = quantitySchema("Enter a seasoning.");

const recipeFormSchema = z.object({
  title: limitedText("Enter a title."),
  description: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(DESCRIPTION_LIMIT, "Use 5000 characters or fewer."),
  ingredients: z
    .array(ingredientsSchema)
    .min(1, "Add at least one ingredient.")
    .max(LIST_LIMIT, "Add 50 ingredients or fewer."),
  seasonings: z
    .array(seasoningsSchema)
    .min(1, "Add at least one seasoning.")
    .max(LIST_LIMIT, "Add 50 seasonings or fewer."),
  instructions: z
    .array(
      z.object({
        description: z
          .string()
          .trim()
          .min(1, "Enter this step.")
          .max(INSTRUCTION_LIMIT, "Use 2000 characters or fewer."),
      }),
    )
    .min(1, "Add at least one instruction.")
    .max(LIST_LIMIT, "Add 50 steps or fewer."),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

type RecipeFormState = {
  message: string;
};

const recipeFormError = (error: z.ZodError): RecipeFormState => {
  return {
    message: firstIssueMessage(error),
  };
};

export {
  DESCRIPTION_LIMIT,
  emptyInstruction,
  emptyQuantity,
  INSTRUCTION_LIMIT,
  recipeFormError,
  recipeFormSchema,
};
export type { RecipeFormState, RecipeFormValues };
