import { and, count, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  recipeBookmarksTable,
  recipeLikesTable,
  recipesTable,
} from "@/db/schema";

type RecipeEngagementState = {
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
};

const emptyEngagement = (): RecipeEngagementState => {
  return {
    likeCount: 0,
    liked: false,
    bookmarked: false,
  };
};

const getEngagementByRecipeIds = async (
  recipeIds: number[],
  userId?: string,
) => {
  const engagement = new Map<number, RecipeEngagementState>(
    recipeIds.map((recipeId) => [recipeId, emptyEngagement()]),
  );

  if (recipeIds.length === 0) {
    return engagement;
  }

  const likeCountsQuery = db
    .select({
      recipeId: recipeLikesTable.recipeId,
      value: count(),
    })
    .from(recipeLikesTable)
    .where(inArray(recipeLikesTable.recipeId, recipeIds))
    .groupBy(recipeLikesTable.recipeId);

  const userLikesQuery = userId
    ? db
        .select({ recipeId: recipeLikesTable.recipeId })
        .from(recipeLikesTable)
        .where(
          and(
            eq(recipeLikesTable.userId, userId),
            inArray(recipeLikesTable.recipeId, recipeIds),
          ),
        )
    : Promise.resolve([]);

  const userBookmarksQuery = userId
    ? db
        .select({ recipeId: recipeBookmarksTable.recipeId })
        .from(recipeBookmarksTable)
        .where(
          and(
            eq(recipeBookmarksTable.userId, userId),
            inArray(recipeBookmarksTable.recipeId, recipeIds),
          ),
        )
    : Promise.resolve([]);

  const [likeCounts, userLikes, userBookmarks] = await Promise.all([
    likeCountsQuery,
    userLikesQuery,
    userBookmarksQuery,
  ]);

  for (const row of likeCounts) {
    const current = engagement.get(row.recipeId);

    if (current) {
      engagement.set(row.recipeId, {
        ...current,
        likeCount: Number(row.value),
      });
    }
  }

  for (const row of userLikes) {
    const current = engagement.get(row.recipeId);

    if (current) {
      engagement.set(row.recipeId, { ...current, liked: true });
    }
  }

  for (const row of userBookmarks) {
    const current = engagement.get(row.recipeId);

    if (current) {
      engagement.set(row.recipeId, { ...current, bookmarked: true });
    }
  }

  return engagement;
};

const getRecipeEngagement = async (recipeId: number, userId?: string) => {
  const engagement = await getEngagementByRecipeIds([recipeId], userId);

  return engagement.get(recipeId) ?? emptyEngagement();
};

const recipeExists = async (recipeId: number) => {
  const [recipe] = await db
    .select({ id: recipesTable.id })
    .from(recipesTable)
    .where(eq(recipesTable.id, recipeId))
    .limit(1);

  return Boolean(recipe);
};

const setRecipeLike = async (
  recipeId: number,
  userId: string,
  liked: boolean,
) => {
  if (!(await recipeExists(recipeId))) {
    return false;
  }

  if (liked) {
    await db
      .insert(recipeLikesTable)
      .values({ userId, recipeId })
      .onConflictDoNothing();
    return true;
  }

  await db
    .delete(recipeLikesTable)
    .where(
      and(
        eq(recipeLikesTable.userId, userId),
        eq(recipeLikesTable.recipeId, recipeId),
      ),
    );

  return true;
};

const setRecipeBookmark = async (
  recipeId: number,
  userId: string,
  bookmarked: boolean,
) => {
  if (!(await recipeExists(recipeId))) {
    return false;
  }

  if (bookmarked) {
    await db
      .insert(recipeBookmarksTable)
      .values({ userId, recipeId })
      .onConflictDoNothing();
    return true;
  }

  await db
    .delete(recipeBookmarksTable)
    .where(
      and(
        eq(recipeBookmarksTable.userId, userId),
        eq(recipeBookmarksTable.recipeId, recipeId),
      ),
    );

  return true;
};

export {
  getEngagementByRecipeIds,
  getRecipeEngagement,
  setRecipeBookmark,
  setRecipeLike,
};
export type { RecipeEngagementState };
