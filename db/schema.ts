import { defineRelations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const recipesTable = pgTable(
  "recipes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id"),
    title: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("recipes_user_id_idx").on(table.userId)],
);

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
  (table) => [index("instructions_recipe_id_idx").on(table.recipeId)],
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
  (table) => [index("seasonings_recipe_id_idx").on(table.recipeId)],
);

export const relations = defineRelations(
  { recipesTable, ingredientsTable, instructionsTable, seasoningsTable },
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
  }),
);
