import * as z from "zod";

import { firstIssueMessage } from "@/lib/forms";

const TEXT_LIMIT = 255;

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
  description: z.string().trim().min(1, "Enter a description."),
  ingredients: z
    .array(ingredientsSchema)
    .min(1, "Add at least one ingredient."),
  seasonings: z.array(seasoningsSchema).min(1, "Add at least one seasoning."),
  instructions: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Enter this step."),
      }),
    )
    .min(1, "Add at least one instruction."),
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

export { emptyInstruction, emptyQuantity, recipeFormError, recipeFormSchema };
export type { RecipeFormState, RecipeFormValues };
