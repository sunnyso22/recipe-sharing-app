import { defineRelations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import {
  DESCRIPTION_LIMIT,
  INSTRUCTION_LIMIT,
  LIST_LIMIT,
  TEXT_LIMIT,
} from "../lib/recipes/limits";

const maxCharacters = (column: AnyPgColumn, limit: number) => {
  return sql`char_length(${column}) <= ${sql.raw(String(limit))}`;
};

const collectionCount = (column: AnyPgColumn) => {
  return sql`${column} between 0 and ${sql.raw(String(LIST_LIMIT))}`;
};

const createdAt = () => timestamp("created_at").notNull().defaultNow();

const updatedAt = () => {
  return timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
};

// better-auth owns users, accounts, and sessions. The Data API has no
// privileges on these tables; Cookery's server login is the only client.
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check("user_name_not_blank", sql`char_length(btrim(${table.name})) > 0`),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const recipesTable = pgTable(
  "recipes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: varchar({ length: TEXT_LIMIT }).notNull(),
    description: text().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("recipes_user_id_idx").on(table.userId),
    check(
      "recipes_description_length",
      maxCharacters(table.description, DESCRIPTION_LIMIT),
    ),
  ],
);

export const ingredientsTable = pgTable(
  "ingredients",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    name: varchar({ length: TEXT_LIMIT }).notNull(),
    quantity: varchar({ length: TEXT_LIMIT }).notNull(),
  },
  (table) => [index("ingredients_recipe_id_idx").on(table.recipeId)],
);

export const instructionsTable = pgTable(
  "instructions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    stepNumber: integer("step_number").notNull(),
    description: text().notNull(),
  },
  (table) => [
    index("instructions_recipe_id_idx").on(table.recipeId),
    check(
      "instructions_description_length",
      maxCharacters(table.description, INSTRUCTION_LIMIT),
    ),
  ],
);

export const seasoningsTable = pgTable(
  "seasonings",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    name: varchar({ length: TEXT_LIMIT }).notNull(),
    quantity: varchar({ length: TEXT_LIMIT }).notNull(),
  },
  (table) => [
    index("seasonings_recipe_id_idx").on(table.recipeId),
  ],
);

// Per-recipe collection caps live on this counter. A count of child rows
// sees the statement snapshot, so two concurrent inserts can both pass.
// Updating the counter locks the latest row and applies the increment to
// that value. Drizzle models the table and its checks. The triggers, the
// recipe_guard schema, and the preflight are custom SQL in
// drizzle/20261120062415_recipe_validation/migration.sql. Title, name, and
// quantity lengths stay on varchar(TEXT_LIMIT). Minimum collection sizes
// stay in the form: a recipe row is written before its children, and an
// update deletes those children before inserting the replacement set.
const recipeGuard = pgSchema("recipe_guard");

export const recipeCollectionCountsTable = recipeGuard.table.withRLS(
  "recipe_collection_counts",
  {
    recipeId: integer("recipe_id")
      .primaryKey()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    ingredientCount: integer("ingredient_count").notNull().default(0),
    seasoningCount: integer("seasoning_count").notNull().default(0),
    instructionCount: integer("instruction_count").notNull().default(0),
  },
  (table) => [
    check(
      "recipe_collection_counts_ingredient_count",
      collectionCount(table.ingredientCount),
    ),
    check(
      "recipe_collection_counts_seasoning_count",
      collectionCount(table.seasoningCount),
    ),
    check(
      "recipe_collection_counts_instruction_count",
      collectionCount(table.instructionCount),
    ),
  ],
);

export const recipeLikesTable = pgTable(
  "recipe_likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.recipeId] }),
    index("recipe_likes_recipe_id_idx").on(table.recipeId),
  ],
);

export const recipeBookmarksTable = pgTable(
  "recipe_bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.recipeId] }),
    index("recipe_bookmarks_recipe_id_idx").on(table.recipeId),
  ],
);

export const relations = defineRelations(
  {
    user,
    session,
    account,
    recipesTable,
    ingredientsTable,
    instructionsTable,
    seasoningsTable,
    recipeLikesTable,
    recipeBookmarksTable,
  },
  (r) => ({
    user: {
      sessions: r.many.session({
        from: r.user.id,
        to: r.session.userId,
      }),
      accounts: r.many.account({
        from: r.user.id,
        to: r.account.userId,
      }),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
        optional: false,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
        optional: false,
      }),
    },
    recipesTable: {
      ingredients: r.many.ingredientsTable({
        from: r.recipesTable.id,
        to: r.ingredientsTable.recipeId,
      }),
      instructions: r.many.instructionsTable({
        from: r.recipesTable.id,
        to: r.instructionsTable.recipeId,
      }),
      seasonings: r.many.seasoningsTable({
        from: r.recipesTable.id,
        to: r.seasoningsTable.recipeId,
      }),
      likes: r.many.recipeLikesTable({
        from: r.recipesTable.id,
        to: r.recipeLikesTable.recipeId,
      }),
      bookmarks: r.many.recipeBookmarksTable({
        from: r.recipesTable.id,
        to: r.recipeBookmarksTable.recipeId,
      }),
    },
    ingredientsTable: {
      recipes: r.one.recipesTable({
        from: r.ingredientsTable.recipeId,
        to: r.recipesTable.id,
        optional: false,
      }),
    },
    instructionsTable: {
      recipes: r.one.recipesTable({
        from: r.instructionsTable.recipeId,
        to: r.recipesTable.id,
        optional: false,
      }),
    },
    seasoningsTable: {
      recipes: r.one.recipesTable({
        from: r.seasoningsTable.recipeId,
        to: r.recipesTable.id,
        optional: false,
      }),
    },
    recipeLikesTable: {
      recipe: r.one.recipesTable({
        from: r.recipeLikesTable.recipeId,
        to: r.recipesTable.id,
        optional: false,
      }),
    },
    recipeBookmarksTable: {
      recipe: r.one.recipesTable({
        from: r.recipeBookmarksTable.recipeId,
        to: r.recipesTable.id,
        optional: false,
      }),
    },
  }),
);
