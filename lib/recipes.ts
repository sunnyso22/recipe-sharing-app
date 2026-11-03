const recipePlaceholder = "/recipe-placeholder.jpg";

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

export { parseRecipeId, recipePlaceholder };
