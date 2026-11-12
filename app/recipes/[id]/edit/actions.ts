"use server";

import { redirect } from "next/navigation";

import { updateRecipe } from "@/db/queries/recipes";
import { getAuthUser } from "@/lib/auth/session";
import { parseRecipeId } from "@/lib/recipes";
import {
  recipeFormError,
  recipeFormSchema,
  type RecipeFormState,
  type RecipeFormValues,
} from "@/lib/recipes/form";
import { revalidateRecipe } from "@/lib/recipes/revalidate";

const updateRecipeAction = async (
  recipeId: number,
  _state: RecipeFormState,
  input: RecipeFormValues,
): Promise<RecipeFormState> => {
  if (parseRecipeId(String(recipeId)) === null) {
    return { message: "This recipe could not be updated." };
  }

  const parsed = recipeFormSchema.safeParse(input);

  if (!parsed.success) {
    return recipeFormError(parsed.error);
  }

  const user = await getAuthUser();

  if (!user) {
    return { message: "This recipe could not be updated." };
  }

  let updatedId: number | null;

  try {
    updatedId = await updateRecipe(recipeId, user.id, parsed.data);
  } catch {
    return { message: "Could not update this recipe. Try again." };
  }

  if (updatedId === null) {
    return { message: "This recipe could not be updated." };
  }

  revalidateRecipe(updatedId);
  redirect(`/recipes/${updatedId}`);
};

export { updateRecipeAction };
