import * as z from "zod";

const TEXT_LIMIT = 255;

const limitedText = (emptyMessage: string) => {
  return z
    .string()
    .trim()
    .min(1, emptyMessage)
    .max(TEXT_LIMIT, "Use 255 characters or fewer.");
};

const ingredientsSchema = z.object({
  name: limitedText("Enter a ingredient."),
  quantity: limitedText("Enter a quantity."),
});
const seasoningsSchema = z.object({
  name: limitedText("Enter a seasoning."),
  quantity: limitedText("Enter a quantity."),
});

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

export { recipeFormSchema };
export type { RecipeFormState, RecipeFormValues };
