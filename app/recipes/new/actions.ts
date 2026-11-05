"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createRecipe } from "@/db/queries/recipes";
import { recipeFormSchema, type RecipeFormValues } from "@/lib/recipe-form";

type RecipeFormState = {
  message: string;
};

const createRecipeAction = async (
  _state: RecipeFormState,
  input: RecipeFormValues,
): Promise<RecipeFormState> => {
  const parsed = recipeFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  let recipeId: number;

  try {
    recipeId = await createRecipe(parsed.data);
  } catch {
    return {
      message: "Could not save this recipe. Try again.",
    };
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${recipeId}`);
};

export { createRecipeAction };
export type { RecipeFormState };
