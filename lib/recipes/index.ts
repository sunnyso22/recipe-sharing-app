const recipePlaceholder = "/recipe-placeholder.jpg";

const readSearchQuery = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;

  return raw?.trim().slice(0, 100) ?? "";
};

type ActorId = string | null | undefined;

const canManageRecipe = (ownerId: string | null, actorId: ActorId) => {
  return ownerId === null || ownerId === actorId;
};

const parseRecipeId = (id: string) => {
  if (!/^[1-9]\d*$/.test(id)) {
    return null;
  }

  const recipeId = Number(id);

  if (!Number.isSafeInteger(recipeId)) {
    return null;
  }

  return recipeId;
};

export { canManageRecipe, parseRecipeId, readSearchQuery, recipePlaceholder };
export type { ActorId };
