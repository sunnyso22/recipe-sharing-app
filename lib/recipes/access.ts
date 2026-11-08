import { getRecipeByParam } from "@/db/queries/recipes";
import { getAuthUser } from "@/lib/auth/session";
import { canManageRecipe } from "@/lib/recipes";

const getManageableRecipe = async (id: string) => {
  const [recipe, user] = await Promise.all([
    getRecipeByParam(id),
    getAuthUser(),
  ]);

  if (!recipe || !canManageRecipe(recipe.userId, user?.id)) {
    return null;
  }

  return recipe;
};

export { getManageableRecipe };
