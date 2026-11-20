import assert from "node:assert/strict";

import { describe, test } from "bun:test";
import { drizzle } from "drizzle-orm/postgres-js";

import {
  recipeCountQuery,
  type RecipeDatabase,
  recipeListQuery,
  type RecipeListScope,
} from "@/db/queries/recipe-list";
import {
  MAX_RECIPE_OFFSET,
  MAX_RECIPE_PAGE,
  RECIPE_PAGE_SIZE,
} from "@/lib/recipes/pagination";

const database = drizzle.mock();

const sqlOf = (
  scope: RecipeListScope,
  page = 1,
) => {
  const statement = recipeListQuery(database, scope, page);

  assert.ok(statement);

  return statement.toSQL();
};

const countOf = (scope: RecipeListScope) => {
  const statement = recipeCountQuery(database, scope);

  assert.ok(statement);

  return statement.toSQL();
};

const refusingDatabase = () => {
  return {
    select() {
      throw new Error("select should not run");
    },
  } as unknown as RecipeDatabase;
};

describe("recipe list queries", () => {
  test("public pages are limited and ordered with an id tie-break", () => {
    const first = sqlOf({ source: "all", query: "" });
    const second = sqlOf({ source: "all", query: "" }, 2);
    const last = sqlOf({ source: "all", query: "" }, MAX_RECIPE_PAGE);

    assert.equal(
      first.sql,
      'select "id", "title" from "recipes" order by "recipes"."created_at" asc, "recipes"."id" asc limit $1',
    );
    assert.deepEqual(first.params, [RECIPE_PAGE_SIZE]);
    assert.equal(second.params.at(-2), RECIPE_PAGE_SIZE);
    assert.equal(second.params.at(-1), RECIPE_PAGE_SIZE);
    assert.match(second.sql, /offset \$2$/);
    assert.equal(last.params.at(-1), MAX_RECIPE_OFFSET);
    assert.equal(first.sql.includes("recipe_likes"), false);
    assert.equal(first.sql.includes("user_id"), false);
  });

  test("pages past the cap and private lists without an owner do not query", () => {
    const database = refusingDatabase();

    assert.equal(
      recipeListQuery(database, { source: "all", query: "" }, MAX_RECIPE_PAGE + 1),
      null,
    );
    assert.equal(
      recipeListQuery(database, { source: "all", query: "" }, 0),
      null,
    );
    assert.equal(
      recipeListQuery(database, { source: "owned", query: "" }, 1),
      null,
    );
    assert.equal(
      recipeListQuery(
        database,
        { source: "owned", query: "soup", userId: "   " },
        1,
      ),
      null,
    );
    assert.equal(
      recipeListQuery(database, { source: "bookmarked", query: "" }, 1),
      null,
    );
    assert.equal(
      recipeCountQuery(database, { source: "bookmarked", query: "soup" }),
      null,
    );
    assert.equal(
      recipeListQuery(
        database,
        { source: "nope" as "all", query: "" },
        1,
      ),
      null,
    );
  });

  test("owned lists stay on that user and keep the updated order", () => {
    const userId = "'); drop table recipes;--";
    const listed = sqlOf({ source: "owned", query: "", userId });
    const counted = countOf({ source: "owned", query: "", userId });

    assert.equal(
      listed.sql,
      'select "id", "title" from "recipes" where "recipes"."user_id" = $1 order by "recipes"."updated_at" desc, "recipes"."id" desc limit $2',
    );
    assert.deepEqual(listed.params, [userId, RECIPE_PAGE_SIZE]);
    assert.equal(listed.sql.includes("drop table"), false);
    assert.equal(
      counted.sql,
      'select count(*) from "recipes" where "recipes"."user_id" = $1',
    );
    assert.deepEqual(counted.params, [userId]);
    assert.equal(counted.sql.includes("limit"), false);
    assert.equal(counted.sql.includes("offset"), false);
  });

  test("search keeps title and description matching, scope, and a stable title order", () => {
    const query = String.raw`100%_a\b`;
    const pattern = String.raw`%100\%\_a\\b%`;
    const listed = sqlOf({ source: "all", query });
    const counted = countOf({ source: "all", query });
    const owned = sqlOf(
      { source: "owned", query, userId: "owner-1" },
      2,
    );

    assert.equal(
      listed.sql,
      'select "id", "title" from "recipes" where (("recipes"."title" ilike $1) or ("recipes"."description" ilike $2)) order by "recipes"."title" asc, "recipes"."id" asc limit $3',
    );
    assert.deepEqual(listed.params, [pattern, pattern, RECIPE_PAGE_SIZE]);
    assert.equal(listed.sql.includes("user_id"), false);
    assert.deepEqual(counted.params, [pattern, pattern]);
    assert.equal(counted.sql.includes("limit"), false);
    assert.equal(
      owned.sql,
      'select "id", "title" from "recipes" where (("recipes"."user_id" = $1) and ((("recipes"."title" ilike $2) or ("recipes"."description" ilike $3)))) order by "recipes"."title" asc, "recipes"."id" asc limit $4 offset $5',
    );
    assert.deepEqual(owned.params, [
      "owner-1",
      pattern,
      pattern,
      RECIPE_PAGE_SIZE,
      RECIPE_PAGE_SIZE,
    ]);
  });

  test("search text is trimmed to 100 characters before it is bound", () => {
    const query = ` ${"a".repeat(150)} `;
    const listed = sqlOf({ source: "all", query });

    assert.equal(listed.params[0], `%${"a".repeat(100)}%`);
  });

  test("a blank search uses the list order for that scope", () => {
    const listed = sqlOf({ source: "all", query: "   " });

    assert.match(listed.sql, /order by "recipes"\."created_at" asc/);
    assert.equal(listed.sql.includes("ilike"), false);
  });

  test("bookmarks stay on the signed-in user and do not filter by recipe owner", () => {
    const listed = sqlOf({
      source: "bookmarked",
      query: "",
      userId: "reader-1",
    });
    const searched = sqlOf({
      source: "bookmarked",
      query: "Soup",
      userId: "reader-1",
    });
    const counted = countOf({
      source: "bookmarked",
      query: "Soup",
      userId: "reader-1",
    });

    assert.equal(
      listed.sql,
      'select "recipes"."id", "recipes"."title" from "recipe_bookmarks" inner join "recipes" on "recipe_bookmarks"."recipe_id" = "recipes"."id" where "recipe_bookmarks"."user_id" = $1 order by "recipe_bookmarks"."created_at" desc, "recipes"."id" desc limit $2',
    );
    assert.deepEqual(listed.params, ["reader-1", RECIPE_PAGE_SIZE]);
    assert.equal(listed.sql.includes('"recipes"."user_id"'), false);
    assert.equal(
      searched.sql,
      'select "recipes"."id", "recipes"."title" from "recipe_bookmarks" inner join "recipes" on "recipe_bookmarks"."recipe_id" = "recipes"."id" where (("recipe_bookmarks"."user_id" = $1) and ((("recipes"."title" ilike $2) or ("recipes"."description" ilike $3)))) order by "recipes"."title" asc, "recipes"."id" asc limit $4',
    );
    assert.deepEqual(searched.params, [
      "reader-1",
      "%Soup%",
      "%Soup%",
      RECIPE_PAGE_SIZE,
    ]);
    assert.equal(
      counted.sql,
      'select count(*) from "recipe_bookmarks" inner join "recipes" on "recipe_bookmarks"."recipe_id" = "recipes"."id" where (("recipe_bookmarks"."user_id" = $1) and ((("recipes"."title" ilike $2) or ("recipes"."description" ilike $3))))',
    );
    assert.deepEqual(counted.params, ["reader-1", "%Soup%", "%Soup%"]);
    assert.equal(counted.sql.includes("recipe_likes"), false);
  });

  test("a passed user id does not narrow the public catalogue", () => {
    const listed = sqlOf({
      source: "all",
      query: "",
      userId: "reader-1",
    });

    assert.equal(listed.sql.includes("user_id"), false);
    assert.deepEqual(listed.params, [RECIPE_PAGE_SIZE]);
  });
});
