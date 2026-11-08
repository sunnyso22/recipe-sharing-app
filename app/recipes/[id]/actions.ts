"use server";

import { redirect } from "next/navigation";

import { deleteRecipe } from "@/db/queries/recipes";
import { safeNextPath } from "@/lib/auth/paths";
import { getAuthUser } from "@/lib/auth/session";
import { parseRecipeId } from "@/lib/recipes";
import { revalidateRecipe } from "@/lib/recipes/revalidate";

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

  const user = await getAuthUser();

  try {
    const deleted = await deleteRecipe(recipeId, user?.id);

    if (!deleted) {
      return { message: "This recipe could not be deleted." };
    }
  } catch {
    return { message: "Could not delete this recipe. Try again." };
  }

  revalidateRecipe(recipeId);

  const next = formData.get("next");
  redirect(typeof next === "string" ? safeNextPath(next) : "/recipes");
};

export { deleteRecipeAction };
export type { DeleteRecipeState };
