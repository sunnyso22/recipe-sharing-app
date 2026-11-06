import { asc, eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import {
  ingredientsTable,
  instructionsTable,
  recipesTable,
  seasoningsTable,
} from "@/db/schema";

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

type QuantityInput = {
  name: string;
  quantity: string;
};

type NewRecipe = {
  title: string;
  description: string;
  ingredients: QuantityInput[];
  seasonings: QuantityInput[];
  instructions: { description: string }[];
};

const createRecipe = (recipe: NewRecipe) => {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(recipesTable)
      .values({
        title: recipe.title,
        description: recipe.description,
      })
      .returning({ id: recipesTable.id });

    if (!created) {
      throw new Error("Recipe was not created");
    }

    await tx.insert(ingredientsTable).values(
      recipe.ingredients.map((ingredient) => ({
        recipeId: created.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
      })),
    );

    await tx.insert(seasoningsTable).values(
      recipe.seasonings.map((seasoning) => ({
        recipeId: created.id,
        name: seasoning.name,
        quantity: seasoning.quantity,
      })),
    );

    await tx.insert(instructionsTable).values(
      recipe.instructions.map((instruction, index) => ({
        recipeId: created.id,
        stepNumber: index + 1,
        description: instruction.description,
      })),
    );

    return created.id;
  });
};

const updateRecipe = (recipeId: number, recipe: NewRecipe) => {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(recipesTable)
      .set({
        title: recipe.title,
        description: recipe.description,
        updatedAt: new Date(),
      })
      .where(eq(recipesTable.id, recipeId))
      .returning({ id: recipesTable.id });

    if (!updated) {
      return null;
    }

    await tx
      .delete(ingredientsTable)
      .where(eq(ingredientsTable.recipeId, recipeId));
    await tx
      .delete(seasoningsTable)
      .where(eq(seasoningsTable.recipeId, recipeId));
    await tx
      .delete(instructionsTable)
      .where(eq(instructionsTable.recipeId, recipeId));

    await tx.insert(ingredientsTable).values(
      recipe.ingredients.map((ingredient) => ({
        recipeId,
        name: ingredient.name,
        quantity: ingredient.quantity,
      })),
    );

    await tx.insert(seasoningsTable).values(
      recipe.seasonings.map((seasoning) => ({
        recipeId,
        name: seasoning.name,
        quantity: seasoning.quantity,
      })),
    );

    await tx.insert(instructionsTable).values(
      recipe.instructions.map((instruction, index) => ({
        recipeId,
        stepNumber: index + 1,
        description: instruction.description,
      })),
    );

    return updated.id;
  });
};

const deleteRecipe = async (recipeId: number) => {
  const [deleted] = await db
    .delete(recipesTable)
    .where(eq(recipesTable.id, recipeId))
    .returning({ id: recipesTable.id });

  return deleted ?? null;
};

export { createRecipe, deleteRecipe, getRecipe, listRecipes, updateRecipe };
export type { RecipeDetails };
