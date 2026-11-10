import { revalidatePath } from "next/cache";

const revalidateRecipeLists = () => {
  revalidatePath("/recipes");
  revalidatePath("/cookbook");
  revalidatePath("/bookmarks");
};

const revalidateRecipe = (recipeId: number) => {
  revalidateRecipeLists();
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/recipes/${recipeId}/edit`);
};

export { revalidateRecipe, revalidateRecipeLists };
