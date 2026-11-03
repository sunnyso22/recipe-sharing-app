import { asc } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { recipesTable } from "@/db/schema";

const listRecipes = () => {
  return db
    .select({
      id: recipesTable.id,
      title: recipesTable.title,
    })
    .from(recipesTable)
    .orderBy(asc(recipesTable.createdAt));
};

const getRecipe = cache((recipeId: number) => {
  return db.query.recipesTable.findFirst({
    where: { id: recipeId },
    with: {
      ingredients: {
        orderBy: { id: "asc" },
      },
      seasonings: {
        orderBy: { id: "asc" },
      },
      instructions: {
        orderBy: { stepNumber: "asc" },
      },
    },
  });
});

type RecipeDetails = NonNullable<Awaited<ReturnType<typeof getRecipe>>>;

export { getRecipe, listRecipes };
export type { RecipeDetails };
