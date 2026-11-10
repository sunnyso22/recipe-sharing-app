"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { setRecipeBookmark, setRecipeLike } from "@/db/queries/engagement";
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

type EngagementState = {
  message: string;
};

const engagementRecipeId = (recipeId: number) => {
  if (typeof recipeId !== "number") {
    return null;
  }

  return parseRecipeId(String(recipeId));
};

const setEngagement = async (
  recipeId: number,
  active: boolean,
  save: (id: number, userId: string, active: boolean) => Promise<boolean>,
  failureMessage: string,
): Promise<EngagementState> => {
  const id = engagementRecipeId(recipeId);

  if (id === null || typeof active !== "boolean") {
    return { message: "This recipe could not be updated." };
  }

  const user = await getAuthUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/recipes/${id}`)}`);
  }

  try {
    const saved = await save(id, user.id, active);

    if (!saved) {
      return { message: "This recipe could not be updated." };
    }
  } catch {
    return { message: failureMessage };
  }

  revalidatePath(`/recipes/${id}`);
  return { message: "" };
};

const setRecipeLikeAction = async (
  recipeId: number,
  liked: boolean,
): Promise<EngagementState> => {
  return setEngagement(
    recipeId,
    liked,
    setRecipeLike,
    "Could not update your like. Try again.",
  );
};

const setRecipeBookmarkAction = async (
  recipeId: number,
  bookmarked: boolean,
): Promise<EngagementState> => {
  return setEngagement(
    recipeId,
    bookmarked,
    setRecipeBookmark,
    "Could not update your bookmark. Try again.",
  );
};

export { deleteRecipeAction, setRecipeBookmarkAction, setRecipeLikeAction };
export type { DeleteRecipeState, EngagementState };
