import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import { readSearchQuery } from "@/lib/recipes";
import {
  MAX_RECIPE_OFFSET,
  MAX_RECIPE_PAGE,
  readRecipePage,
  RECIPE_PAGE_SIZE,
  recipeCountLabel,
  recipeListHref,
  recipeListView,
  recipePageRedirectHref,
  recipeQueryBounds,
  recipeSearchHref,
} from "@/lib/recipes/pagination";

describe("recipe page params", () => {
  test("uses a fixed page size and a capped offset", () => {
    assert.equal(RECIPE_PAGE_SIZE, 12);
    assert.equal(MAX_RECIPE_PAGE, 100);
    assert.equal(MAX_RECIPE_OFFSET, 1188);
    assert.deepEqual(recipeQueryBounds(1), { limit: 12, offset: 0 });
    assert.deepEqual(recipeQueryBounds(2), { limit: 12, offset: 12 });
    assert.deepEqual(recipeQueryBounds(100), { limit: 12, offset: 1188 });
    assert.equal(recipeQueryBounds(0), null);
    assert.equal(recipeQueryBounds(101), null);
    assert.equal(recipeQueryBounds(1.5), null);
    assert.equal(recipeQueryBounds(Number.NaN), null);
    assert.equal(recipeQueryBounds(Number.POSITIVE_INFINITY), null);
  });

  test("reads a missing page as the first page and rejects unsafe values", () => {
    assert.deepEqual(readRecipePage(undefined), { status: "page", page: 1 });
    assert.deepEqual(readRecipePage(""), { status: "page", page: 1 });
    assert.deepEqual(readRecipePage("1"), { status: "page", page: 1 });
    assert.deepEqual(readRecipePage("12"), { status: "page", page: 12 });
    assert.deepEqual(readRecipePage("100"), { status: "page", page: 100 });
    assert.deepEqual(readRecipePage(["2", "9"]), { status: "page", page: 2 });

    for (const value of ["0", "-1", "abc", "1.5", "02", " 2", "2e1", "+2", "1 "]) {
      assert.deepEqual(readRecipePage(value), { status: "invalid" }, value);
    }

    assert.deepEqual(readRecipePage(["nope", "2"]), { status: "invalid" });
    assert.deepEqual(readRecipePage("101"), { status: "over-limit" });
    assert.deepEqual(readRecipePage("999999"), { status: "over-limit" });
    assert.deepEqual(readRecipePage("9".repeat(20)), { status: "invalid" });
  });

  test("pagination links keep the search and omit the first page", () => {
    const query = readSearchQuery("  tomato soup  ");

    assert.equal(recipeListHref("/recipes", "", 1), "/recipes");
    assert.equal(recipeListHref("/recipes", "", 2), "/recipes?page=2");
    assert.equal(
      recipeListHref("/cookbook", query, 2),
      "/cookbook?q=tomato+soup&page=2",
    );
    assert.equal(
      recipeListHref("/bookmarks", "a&b", 3),
      "/bookmarks?q=a%26b&page=3",
    );
  });

  test("an invalid page redirects to the first page and keeps the search", () => {
    const invalid = readRecipePage("abc");

    assert.equal(
      recipePageRedirectHref("/recipes", "soup", invalid),
      "/recipes?q=soup",
    );
    assert.equal(
      recipePageRedirectHref("/cookbook", "", readRecipePage("0")),
      "/cookbook",
    );
    assert.equal(
      recipePageRedirectHref("/recipes", "", readRecipePage(undefined)),
      null,
    );
    assert.equal(
      recipePageRedirectHref("/recipes", "", readRecipePage("101")),
      null,
    );
  });

  test("changing the search drops the page and clearing it drops both", () => {
    const current = new URLSearchParams("q=soup&page=4&ref=home");

    assert.equal(
      recipeSearchHref("/recipes", current, "stew"),
      "/recipes?q=stew&ref=home",
    );
    assert.equal(
      recipeSearchHref("/bookmarks", current, ""),
      "/bookmarks?ref=home",
    );
    assert.equal(
      recipeSearchHref("/cookbook", new URLSearchParams("page=2"), "a&b"),
      "/cookbook?q=a%26b",
    );
  });

  test("empty, out-of-range, and in-range pages stay distinct", () => {
    assert.deepEqual(recipeListView(0, { status: "page", page: 1 }), {
      status: "empty",
    });
    assert.deepEqual(recipeListView(0, { status: "over-limit" }), {
      status: "empty",
    });
    assert.deepEqual(recipeListView(12, { status: "page", page: 1 }), {
      status: "results",
      page: 1,
      total: 12,
      totalPages: 1,
    });
    assert.deepEqual(recipeListView(13, { status: "page", page: 2 }), {
      status: "results",
      page: 2,
      total: 13,
      totalPages: 2,
    });
    assert.deepEqual(recipeListView(13, { status: "page", page: 3 }), {
      status: "out-of-range",
      total: 13,
      totalPages: 2,
    });
    assert.deepEqual(recipeListView(13, { status: "over-limit" }), {
      status: "out-of-range",
      total: 13,
      totalPages: 2,
    });
    assert.equal(recipeCountLabel(0), "0 recipes");
    assert.equal(recipeCountLabel(1), "1 recipe");
    assert.equal(recipeCountLabel(24), "24 recipes");
  });
});
