import { defineRelations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  integer,
  pgPolicy,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

// auth.users already exists in Supabase. Mark the schema existing so
// drizzle-kit does not try to create or alter it.
const authSchema = pgSchema("auth").existing();

const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

const isAuthUser = (userId: AnyPgColumn) => {
  return sql`${userId} = (select auth.uid())`;
};

const publicReadPolicy = (name: string) => {
  return pgPolicy(name, {
    for: "select",
    to: [anonRole, authenticatedRole],
    using: sql`true`,
  });
};

export const recipesTable = pgTable(
  "recipes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("recipes_user_id_idx").on(table.userId),
    publicReadPolicy("recipes_public_read"),
    pgPolicy("recipes_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isAuthUser(table.userId),
    }),
    pgPolicy("recipes_update_own", {
      for: "update",
      to: authenticatedRole,
      using: isAuthUser(table.userId),
      withCheck: isAuthUser(table.userId),
    }),
    pgPolicy("recipes_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: isAuthUser(table.userId),
    }),
  ],
);

const recipeOwnedByUser = (recipeId: AnyPgColumn) => {
  return sql`exists (
    select 1
    from ${recipesTable}
    where ${recipesTable.id} = ${recipeId}
      and ${recipesTable.userId} = (select auth.uid())
  )`;
};

const childWritePolicies = (tableName: string, recipeId: AnyPgColumn) => {
  return [
    pgPolicy(`${tableName}_insert_own`, {
      for: "insert",
      to: authenticatedRole,
      withCheck: recipeOwnedByUser(recipeId),
    }),
    pgPolicy(`${tableName}_update_own`, {
      for: "update",
      to: authenticatedRole,
      using: recipeOwnedByUser(recipeId),
      withCheck: recipeOwnedByUser(recipeId),
    }),
    pgPolicy(`${tableName}_delete_own`, {
      for: "delete",
      to: authenticatedRole,
      using: recipeOwnedByUser(recipeId),
    }),
  ];
};

export const ingredientsTable = pgTable(
  "ingredients",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    quantity: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    index("ingredients_recipe_id_idx").on(table.recipeId),
    publicReadPolicy("ingredients_public_read"),
    ...childWritePolicies("ingredients", table.recipeId),
  ],
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
    publicReadPolicy("instructions_public_read"),
    ...childWritePolicies("instructions", table.recipeId),
  ],
);

export const seasoningsTable = pgTable(
  "seasonings",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    quantity: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    index("seasonings_recipe_id_idx").on(table.recipeId),
    publicReadPolicy("seasonings_public_read"),
    ...childWritePolicies("seasonings", table.recipeId),
  ],
);

const membershipPolicies = (tableName: string, userId: AnyPgColumn) => {
  return [
    pgPolicy(`${tableName}_select_own`, {
      for: "select",
      to: authenticatedRole,
      using: isAuthUser(userId),
    }),
    pgPolicy(`${tableName}_insert_own`, {
      for: "insert",
      to: authenticatedRole,
      withCheck: isAuthUser(userId),
    }),
    pgPolicy(`${tableName}_delete_own`, {
      for: "delete",
      to: authenticatedRole,
      using: isAuthUser(userId),
    }),
  ];
};

export const recipeLikesTable = pgTable(
  "recipe_likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.recipeId] }),
    index("recipe_likes_recipe_id_idx").on(table.recipeId),
    ...membershipPolicies("recipe_likes", table.userId),
  ],
);

export const recipeBookmarksTable = pgTable(
  "recipe_bookmarks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.recipeId] }),
    index("recipe_bookmarks_recipe_id_idx").on(table.recipeId),
    ...membershipPolicies("recipe_bookmarks", table.userId),
  ],
);

export const relations = defineRelations(
  {
    recipesTable,
    ingredientsTable,
    instructionsTable,
    seasoningsTable,
    recipeLikesTable,
    recipeBookmarksTable,
  },
  (r) => ({
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
