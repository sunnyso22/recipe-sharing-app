"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateRecipe } from "@/db/queries/recipes";
import {
  recipeFormSchema,
  type RecipeFormState,
  type RecipeFormValues,
} from "@/lib/recipe-form";
import { parseRecipeId } from "@/lib/recipes";

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
    return {
      message:
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  let updatedId: number | null;

  try {
    updatedId = await updateRecipe(recipeId, parsed.data);
  } catch {
    return { message: "Could not update this recipe. Try again." };
  }

  if (updatedId === null) {
    return { message: "This recipe could not be updated." };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${updatedId}`);
  revalidatePath(`/recipes/${updatedId}/edit`);
  redirect(`/recipes/${updatedId}`);
};

export { updateRecipeAction };
