"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteRecipe } from "@/db/queries/recipes";
import { parseRecipeId } from "@/lib/recipes";

type DeleteRecipeState = {
  message: string;
};

const deleteRecipeAction = async (
  _state: DeleteRecipeState,
  formData: FormData,
): Promise<DeleteRecipeState> => {
  const recipeId = parseRecipeId(String(formData.get("recipeId") ?? ""));

  if (recipeId === null) {
    return { message: "This recipe could not be deleted." };
  }

  try {
    await deleteRecipe(recipeId);
  } catch {
    return { message: "Could not delete this recipe. Try again." };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  redirect("/recipes");
};

export { deleteRecipeAction };
export type { DeleteRecipeState };
