import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  recipeBookmarksTable,
  recipeLikesTable,
  recipesTable,
} from "@/db/schema";

const likeCountFor = (recipeId: number) => {
  return db
    .select({ value: count() })
    .from(recipeLikesTable)
    .where(eq(recipeLikesTable.recipeId, recipeId));
};

const getRecipeEngagement = async (recipeId: number, userId?: string) => {
  const likesQuery = likeCountFor(recipeId);

  if (!userId) {
    const [likes] = await likesQuery;

    return {
      likeCount: Number(likes?.value ?? 0),
      liked: false,
      bookmarked: false,
    };
  }

  const [likes, likeRows, bookmarkRows] = await Promise.all([
    likesQuery,
    db
      .select({ userId: recipeLikesTable.userId })
      .from(recipeLikesTable)
      .where(
        and(
          eq(recipeLikesTable.recipeId, recipeId),
          eq(recipeLikesTable.userId, userId),
        ),
      )
      .limit(1),
    db
      .select({ userId: recipeBookmarksTable.userId })
      .from(recipeBookmarksTable)
      .where(
        and(
          eq(recipeBookmarksTable.recipeId, recipeId),
          eq(recipeBookmarksTable.userId, userId),
        ),
      )
      .limit(1),
  ]);

  const [likesRow] = likes;

  return {
    likeCount: Number(likesRow?.value ?? 0),
    liked: likeRows.length > 0,
    bookmarked: bookmarkRows.length > 0,
  };
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

export { getRecipeEngagement, setRecipeBookmark, setRecipeLike };
