import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import {
  ingredientsTable,
  instructionsTable,
  recipesTable,
  seasoningsTable,
} from "@/db/schema";
import {
  type ActorId,
  canManageRecipe,
  parseRecipeId,
} from "@/lib/recipes";

const recipeSummaryColumns = {
  id: recipesTable.id,
  title: recipesTable.title,
};

const listRecipes = () => {
  return db
    .select(recipeSummaryColumns)
    .from(recipesTable)
    .orderBy(asc(recipesTable.createdAt));
};

const escapeIlike = (value: string) => {
  return value.replace(/[%_\\]/g, "\\$&");
};

const listRecipesByUser = (userId: string) => {
  return db
    .select({
      ...recipeSummaryColumns,
      updatedAt: recipesTable.updatedAt,
    })
    .from(recipesTable)
    .where(eq(recipesTable.userId, userId))
    .orderBy(desc(recipesTable.updatedAt));
};

const searchRecipes = (query: string) => {
  const pattern = `%${escapeIlike(query)}%`;

  return db
    .select(recipeSummaryColumns)
    .from(recipesTable)
    .where(
      or(
        ilike(recipesTable.title, pattern),
        ilike(recipesTable.description, pattern),
      ),
    )
    .orderBy(asc(recipesTable.title));
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

const getRecipeByParam = async (id: string) => {
  const recipeId = parseRecipeId(id);

  if (recipeId === null) {
    return null;
  }

  return (await getRecipe(recipeId)) ?? null;
};

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

type RecipeTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const quantityRows = (recipeId: number, rows: QuantityInput[]) => {
  return rows.map((row) => ({
    recipeId,
    name: row.name,
    quantity: row.quantity,
  }));
};

const insertRecipeChildren = async (
  tx: RecipeTransaction,
  recipeId: number,
  recipe: NewRecipe,
) => {
  await tx
    .insert(ingredientsTable)
    .values(quantityRows(recipeId, recipe.ingredients));

  await tx
    .insert(seasoningsTable)
    .values(quantityRows(recipeId, recipe.seasonings));

  await tx.insert(instructionsTable).values(
    recipe.instructions.map((instruction, index) => ({
      recipeId,
      stepNumber: index + 1,
      description: instruction.description,
    })),
  );
};

const clearRecipeChildren = async (
  tx: RecipeTransaction,
  recipeId: number,
) => {
  await tx
    .delete(ingredientsTable)
    .where(eq(ingredientsTable.recipeId, recipeId));
  await tx
    .delete(seasoningsTable)
    .where(eq(seasoningsTable.recipeId, recipeId));
  await tx
    .delete(instructionsTable)
    .where(eq(instructionsTable.recipeId, recipeId));
};

const recipeOwner = async (recipeId: number) => {
  const [recipe] = await db
    .select({ userId: recipesTable.userId })
    .from(recipesTable)
    .where(eq(recipesTable.id, recipeId))
    .limit(1);

  return recipe ?? null;
};

const createRecipe = (userId: string, recipe: NewRecipe) => {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(recipesTable)
      .values({
        userId,
        title: recipe.title,
        description: recipe.description,
      })
      .returning({ id: recipesTable.id });

    if (!created) {
      throw new Error("Recipe was not created");
    }

    await insertRecipeChildren(tx, created.id, recipe);

    return created.id;
  });
};

const updateRecipe = (
  recipeId: number,
  actorId: ActorId,
  recipe: NewRecipe,
) => {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ userId: recipesTable.userId })
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .limit(1);

    if (!existing || !canManageRecipe(existing.userId, actorId)) {
      return null;
    }

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

    await clearRecipeChildren(tx, recipeId);
    await insertRecipeChildren(tx, recipeId, recipe);

    return updated.id;
  });
};

const deleteRecipe = async (recipeId: number, actorId: ActorId) => {
  const existing = await recipeOwner(recipeId);

  if (!existing || !canManageRecipe(existing.userId, actorId)) {
    return null;
  }

  const [deleted] = await db
    .delete(recipesTable)
    .where(eq(recipesTable.id, recipeId))
    .returning({ id: recipesTable.id });

  return deleted ?? null;
};

export {
  createRecipe,
  deleteRecipe,
  getRecipe,
  getRecipeByParam,
  listRecipes,
  listRecipesByUser,
  searchRecipes,
  updateRecipe,
};
export type { RecipeDetails };
