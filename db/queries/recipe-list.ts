import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { recipeBookmarksTable, recipesTable } from "@/db/schema";
import {
  RECIPE_PAGE_SIZE,
  recipeQueryBounds,
} from "@/lib/recipes/pagination";

type RecipeDatabase = Pick<PostgresJsDatabase, "select">;

type RecipeListSource = "all" | "owned" | "bookmarked";

type RecipeListScope = {
  source: RecipeListSource;
  query: string;
  userId?: string;
};

type RecipeSummary = {
  id: number;
  title: string;
};

type RecipeListPage = {
  items: RecipeSummary[];
  total: number;
};

const summaryColumns = {
  id: recipesTable.id,
  title: recipesTable.title,
};

const createdOrder = [asc(recipesTable.createdAt), asc(recipesTable.id)] as const;
const updatedOrder = [desc(recipesTable.updatedAt), desc(recipesTable.id)] as const;
const titleOrder = [asc(recipesTable.title), asc(recipesTable.id)] as const;
const bookmarkOrder = [
  desc(recipeBookmarksTable.createdAt),
  desc(recipesTable.id),
] as const;

const escapeIlike = (value: string) => {
  return value.replace(/[%_\\]/g, "\\$&");
};

const normalizedQuery = (query: string) => {
  return query.trim().slice(0, 100);
};

const textMatch = (query: string) => {
  const pattern = `%${escapeIlike(query)}%`;
  const match = or(
    ilike(recipesTable.title, pattern),
    ilike(recipesTable.description, pattern),
  );

  if (!match) {
    throw new Error("Recipe search match was not created");
  }

  return match;
};

const listWhere = (scope: RecipeListScope) => {
  if (
    scope.source !== "all" &&
    scope.source !== "owned" &&
    scope.source !== "bookmarked"
  ) {
    return null;
  }

  const query = normalizedQuery(scope.query);
  const userId = scope.userId?.trim() ?? "";

  if (scope.source !== "all" && !userId) {
    return null;
  }

  const match = query ? textMatch(query) : undefined;

  if (scope.source === "bookmarked") {
    const bookmark = eq(recipeBookmarksTable.userId, userId);
    const combined = match ? and(bookmark, match) : bookmark;

    return combined ?? null;
  }

  if (scope.source === "owned") {
    const owner = eq(recipesTable.userId, userId);
    const combined = match ? and(owner, match) : owner;

    return combined ?? null;
  }

  return match;
};

type RecipeListStatement = {
  toSQL(): { sql: string; params: unknown[] };
  then: Promise<RecipeSummary[]>["then"];
};

const withPage = (
  query: {
    limit(limit: number): {
      offset(offset: number): {
        toSQL(): { sql: string; params: unknown[] };
      };
      toSQL(): { sql: string; params: unknown[] };
    };
  },
  page: number,
) => {
  const bounds = recipeQueryBounds(page);

  if (!bounds) {
    return null;
  }

  const limited = query.limit(bounds.limit);
  const paged =
    bounds.offset === 0 ? limited : limited.offset(bounds.offset);

  return paged as RecipeListStatement;
};

const listOrder = (scope: RecipeListScope) => {
  if (normalizedQuery(scope.query)) {
    return titleOrder;
  }

  if (scope.source === "owned") {
    return updatedOrder;
  }

  if (scope.source === "bookmarked") {
    return bookmarkOrder;
  }

  return createdOrder;
};

const recipeListQuery = (
  database: RecipeDatabase,
  scope: RecipeListScope,
  page: number,
) => {
  const where = listWhere(scope);

  if (where === null || !recipeQueryBounds(page)) {
    return null;
  }

  if (scope.source === "bookmarked") {
    return withPage(
      database
        .select(summaryColumns)
        .from(recipeBookmarksTable)
        .innerJoin(
          recipesTable,
          eq(recipeBookmarksTable.recipeId, recipesTable.id),
        )
        .where(where)
        .orderBy(...listOrder(scope)),
      page,
    );
  }

  if (scope.source !== "owned" && scope.source !== "all") {
    return null;
  }

  const selected = database.select(summaryColumns).from(recipesTable);
  const filtered = where ? selected.where(where) : selected;

  return withPage(filtered.orderBy(...listOrder(scope)), page);
};

const recipeCountQuery = (database: RecipeDatabase, scope: RecipeListScope) => {
  const where = listWhere(scope);

  if (where === null) {
    return null;
  }

  if (scope.source === "bookmarked") {
    return database
      .select({ value: count() })
      .from(recipeBookmarksTable)
      .innerJoin(
        recipesTable,
        eq(recipeBookmarksTable.recipeId, recipesTable.id),
      )
      .where(where);
  }

  if (scope.source !== "owned" && scope.source !== "all") {
    return null;
  }

  const selected = database.select({ value: count() }).from(recipesTable);

  return where ? selected.where(where) : selected;
};

const fetchRecipeListPage = async (
  database: RecipeDatabase,
  scope: RecipeListScope,
  page: number | null,
): Promise<RecipeListPage> => {
  const totals = recipeCountQuery(database, scope);

  if (!totals) {
    return { items: [], total: 0 };
  }

  const rows = page === null ? null : recipeListQuery(database, scope, page);
  const empty: Promise<RecipeSummary[]> = Promise.resolve([]);
  const [countRows, items] = await Promise.all([totals, rows ?? empty]);
  const total = Number(countRows[0]?.value ?? 0);

  return {
    items: items.slice(0, RECIPE_PAGE_SIZE),
    total: Number.isSafeInteger(total) && total >= 0 ? total : 0,
  };
};

export {
  fetchRecipeListPage,
  recipeCountQuery,
  recipeListQuery,
};
export type { RecipeDatabase, RecipeListPage, RecipeListScope, RecipeSummary };
