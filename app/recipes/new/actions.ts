"use server";

import { redirect } from "next/navigation";

import { createRecipe } from "@/db/queries/recipes";
import { requireAuthUser } from "@/lib/auth/session";
import {
  recipeFormError,
  recipeFormSchema,
  type RecipeFormState,
  type RecipeFormValues,
} from "@/lib/recipes/form";
import { revalidateRecipeLists } from "@/lib/recipes/revalidate";

const createRecipeAction = async (
  _state: RecipeFormState,
  input: RecipeFormValues,
): Promise<RecipeFormState> => {
  const parsed = recipeFormSchema.safeParse(input);

  if (!parsed.success) {
    return recipeFormError(parsed.error);
  }

  const user = await requireAuthUser();

  let recipeId: number;

  try {
    recipeId = await createRecipe(user.id, parsed.data);
  } catch {
    return {
      message: "Could not save this recipe. Try again.",
    };
  }

  revalidateRecipeLists();
  redirect(`/recipes/${recipeId}`);
};

export { createRecipeAction };
