import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { describe, test } from "bun:test";

import { recipeFormSchema } from "@/lib/recipes/form";
import {
  DESCRIPTION_LIMIT,
  INSTRUCTION_LIMIT,
  LIST_LIMIT,
  TEXT_LIMIT,
} from "@/lib/recipes/limits";

const migrationPath =
  "drizzle/20261120062415_recipe_validation/migration.sql";
const migration = readFileSync(migrationPath, "utf8");

const items = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    name: `item ${index}`,
    quantity: "1",
  }));
};

const recipe = {
  title: "Soup",
  description: "Warm",
  ingredients: items(1),
  seasonings: items(1),
  instructions: [{ description: "Boil" }],
};

describe("recipe form limits", () => {
  test("accepts the maximum length and collection size", () => {
    const parsed = recipeFormSchema.safeParse({
      ...recipe,
      title: "a".repeat(TEXT_LIMIT),
      description: "a".repeat(DESCRIPTION_LIMIT),
      ingredients: items(LIST_LIMIT),
      seasonings: items(LIST_LIMIT),
      instructions: [
        { description: "a".repeat(INSTRUCTION_LIMIT) },
        ...Array.from({ length: LIST_LIMIT - 1 }, () => ({
          description: "Step",
        })),
      ],
    });

    assert.equal(parsed.success, true);
  });

  test("rejects text and collections over the shared maximums", () => {
    assert.equal(
      recipeFormSchema.safeParse({
        ...recipe,
        title: "a".repeat(TEXT_LIMIT + 1),
      }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({
        ...recipe,
        description: "a".repeat(DESCRIPTION_LIMIT + 1),
      }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({
        ...recipe,
        ingredients: items(LIST_LIMIT + 1),
      }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({
        ...recipe,
        seasonings: items(LIST_LIMIT + 1),
      }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({
        ...recipe,
        instructions: Array.from({ length: LIST_LIMIT + 1 }, () => ({
          description: "Step",
        })),
      }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({
        ...recipe,
        instructions: [{ description: "a".repeat(INSTRUCTION_LIMIT + 1) }],
      }).success,
      false,
    );
  });

  test("keeps the form minimums", () => {
    assert.equal(
      recipeFormSchema.safeParse({ ...recipe, title: "   " }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({ ...recipe, description: "" }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({ ...recipe, ingredients: [] }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({ ...recipe, seasonings: [] }).success,
      false,
    );
    assert.equal(
      recipeFormSchema.safeParse({ ...recipe, instructions: [] }).success,
      false,
    );
  });

  test("counts one emoji as one character, like Postgres char_length", () => {
    const emoji = "🍜";

    assert.equal(emoji.length, 2);
    assert.equal([...emoji].length, 1);
    assert.equal(
      recipeFormSchema.safeParse({
        ...recipe,
        title: emoji.repeat(TEXT_LIMIT),
      }).success,
      true,
    );
    assert.equal(
      recipeFormSchema.safeParse({
        ...recipe,
        title: emoji.repeat(TEXT_LIMIT + 1),
      }).success,
      false,
    );
  });
});

describe("recipe validation migration", () => {
  test("matches the shared limits and does not destroy rows", () => {
    const chunks = migration.split("--> statement-breakpoint");

    assert.ok(chunks.every((chunk) => chunk.trim().length > 0));
    assert.match(
      migration,
      new RegExp(`char_length\\("description"\\) <= ${DESCRIPTION_LIMIT}`),
    );
    assert.match(
      migration,
      new RegExp(`char_length\\("description"\\) <= ${INSTRUCTION_LIMIT}`),
    );
    assert.match(migration, new RegExp(`between 0 and ${LIST_LIMIT}`));
    assert.match(
      migration,
      new RegExp(`must stay between 0 and ${LIST_LIMIT}`),
    );
    assert.match(migration, /does not truncate or delete rows/);
    assert.doesNotMatch(migration, /^\s*delete\s+from\b/im);
    assert.doesNotMatch(migration, /^\s*truncate\b/im);
    assert.match(migration, /CREATE SCHEMA "recipe_guard"/);
    assert.match(migration, /recipe_collection_counts/);
    assert.match(
      migration,
      /LOCK TABLE public\.recipes,\s+public\.ingredients,\s+public\.instructions,\s+public\.seasonings\s+IN SHARE ROW EXCLUSIVE MODE/,
    );
  });
});
