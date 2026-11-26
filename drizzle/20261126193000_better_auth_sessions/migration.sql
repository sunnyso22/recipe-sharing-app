-- Drop the old rows. Supabase Auth users, passwords, sessions, and recipes
-- are not migrated. Child rows follow ON DELETE CASCADE.
TRUNCATE TABLE "recipes" RESTART IDENTITY CASCADE;
--> statement-breakpoint
DROP POLICY IF EXISTS "ingredients_public_read" ON "ingredients";
--> statement-breakpoint
DROP POLICY IF EXISTS "ingredients_insert_own" ON "ingredients";
--> statement-breakpoint
DROP POLICY IF EXISTS "ingredients_update_own" ON "ingredients";
--> statement-breakpoint
DROP POLICY IF EXISTS "ingredients_delete_own" ON "ingredients";
--> statement-breakpoint
DROP POLICY IF EXISTS "instructions_public_read" ON "instructions";
--> statement-breakpoint
DROP POLICY IF EXISTS "instructions_insert_own" ON "instructions";
--> statement-breakpoint
DROP POLICY IF EXISTS "instructions_update_own" ON "instructions";
--> statement-breakpoint
DROP POLICY IF EXISTS "instructions_delete_own" ON "instructions";
--> statement-breakpoint
DROP POLICY IF EXISTS "seasonings_public_read" ON "seasonings";
--> statement-breakpoint
DROP POLICY IF EXISTS "seasonings_insert_own" ON "seasonings";
--> statement-breakpoint
DROP POLICY IF EXISTS "seasonings_update_own" ON "seasonings";
--> statement-breakpoint
DROP POLICY IF EXISTS "seasonings_delete_own" ON "seasonings";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipe_bookmarks_select_own" ON "recipe_bookmarks";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipe_bookmarks_insert_own" ON "recipe_bookmarks";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipe_bookmarks_delete_own" ON "recipe_bookmarks";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipe_likes_select_own" ON "recipe_likes";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipe_likes_insert_own" ON "recipe_likes";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipe_likes_delete_own" ON "recipe_likes";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipes_public_read" ON "recipes";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipes_insert_own" ON "recipes";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipes_update_own" ON "recipes";
--> statement-breakpoint
DROP POLICY IF EXISTS "recipes_delete_own" ON "recipes";
--> statement-breakpoint
ALTER TABLE "ingredients" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "instructions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "seasonings" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipe_likes" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipes" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ingredients" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "instructions" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "seasonings" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipe_likes" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipes" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" DROP CONSTRAINT "recipe_bookmarks_user_id_users_id_fkey";
--> statement-breakpoint
ALTER TABLE "recipe_likes" DROP CONSTRAINT "recipe_likes_user_id_users_id_fkey";
--> statement-breakpoint
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_user_id_users_id_fkey";
--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "user_id" TYPE text USING "user_id"::text;
--> statement-breakpoint
ALTER TABLE "recipe_likes" ALTER COLUMN "user_id" TYPE text USING "user_id"::text;
--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" ALTER COLUMN "user_id" TYPE text USING "user_id"::text;
--> statement-breakpoint
CREATE TABLE "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "user_name_not_blank" CHECK (char_length(btrim("name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");
--> statement-breakpoint
CREATE TABLE "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" ("user_id");
--> statement-breakpoint
CREATE TABLE "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");
--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" ADD CONSTRAINT "recipe_bookmarks_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint
DO $$
DECLARE
  rel text;
  actor text;
  actors text[] := ARRAY['anon', 'authenticated', 'service_role'];
  relations text[] := ARRAY[
    'recipes',
    'ingredients',
    'instructions',
    'seasonings',
    'recipe_likes',
    'recipe_bookmarks',
    'user',
    'session',
    'account',
    'verification'
  ];
  sequences text[] := ARRAY[
    'recipes_id_seq',
    'ingredients_id_seq',
    'instructions_id_seq',
    'seasonings_id_seq'
  ];
BEGIN
  FOREACH rel IN ARRAY relations LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', rel);
    FOREACH actor IN ARRAY actors LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = actor) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', rel, actor);
      END IF;
    END LOOP;
  END LOOP;

  FOREACH rel IN ARRAY sequences LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM PUBLIC', rel);
    FOREACH actor IN ARRAY actors LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = actor) THEN
        EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM %I', rel, actor);
      END IF;
    END LOOP;
  END LOOP;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION recipe_guard.apply_recipe_child_delta(
  target_recipe_id integer,
  child_table text,
  delta integer,
  missing_ok boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  next_count integer;
  constraint_name text;
BEGIN
  IF child_table NOT IN ('ingredients', 'seasonings', 'instructions') THEN
    RAISE EXCEPTION 'unexpected recipe child table %', child_table
      USING ERRCODE = '0A000';
  END IF;

  IF delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'recipe collection counts only move by one row'
      USING ERRCODE = '0A000';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.recipes AS recipe
    WHERE recipe.id = target_recipe_id
  ) THEN
    IF missing_ok THEN
      RETURN;
    END IF;

    RAISE EXCEPTION 'recipe % does not exist', target_recipe_id
      USING ERRCODE = '23503';
  END IF;

  -- Lock the parent before the child foreign key takes its key share, and
  -- before the counter update. Callers lock recipe ids in ascending order.
  PERFORM 1
  FROM public.recipes AS recipe
  WHERE recipe.id = target_recipe_id
  FOR UPDATE;

  constraint_name := CASE child_table
    WHEN 'ingredients' THEN 'recipe_collection_counts_ingredient_count'
    WHEN 'seasonings' THEN 'recipe_collection_counts_seasoning_count'
    ELSE 'recipe_collection_counts_instruction_count'
  END;

  BEGIN
    IF child_table = 'ingredients' THEN
      UPDATE recipe_guard.recipe_collection_counts AS counts
      SET ingredient_count = counts.ingredient_count + delta
      WHERE counts.recipe_id = target_recipe_id
      RETURNING counts.ingredient_count INTO next_count;
    ELSIF child_table = 'seasonings' THEN
      UPDATE recipe_guard.recipe_collection_counts AS counts
      SET seasoning_count = counts.seasoning_count + delta
      WHERE counts.recipe_id = target_recipe_id
      RETURNING counts.seasoning_count INTO next_count;
    ELSE
      UPDATE recipe_guard.recipe_collection_counts AS counts
      SET instruction_count = counts.instruction_count + delta
      WHERE counts.recipe_id = target_recipe_id
      RETURNING counts.instruction_count INTO next_count;
    END IF;
  EXCEPTION
    WHEN check_violation THEN
      RAISE EXCEPTION
        '% for recipe % must stay between 0 and 50',
        child_table,
        target_recipe_id
        USING ERRCODE = '23514',
              CONSTRAINT = constraint_name;
  END;

  IF next_count IS NULL THEN
    IF missing_ok AND delta < 0 THEN
      RETURN;
    END IF;

    RAISE EXCEPTION 'recipe % has no collection counter', target_recipe_id
      USING ERRCODE = '23503';
  END IF;
END;
$$;
--> statement-breakpoint
DROP SCHEMA auth CASCADE;
