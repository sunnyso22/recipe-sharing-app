-- Database limits for direct PostgREST writes. The form already rejects the
-- same maximums in lib/recipes/limits.ts. varchar(255) from the baseline
-- already caps title, ingredient name, ingredient quantity, seasoning name,
-- and seasoning quantity. This migration adds the limits that were only in
-- Zod:
--   recipes.description             5000 characters
--   instructions.description        2000 characters
--   ingredients per recipe          50
--   seasonings per recipe           50
--   instructions per recipe         50
--
-- Character length uses char_length. Zod 4 counts Unicode code points too,
-- so a Chinese character or an emoji counts as one on both sides. A grapheme
-- built from several code points counts as several on both sides.
--
-- Empty and whitespace-only text stays allowed here. The form still trims
-- and requires one character. A database minimum would reject stored rows
-- the current schema accepts.
--
-- A recipe may still have zero ingredients, seasonings, or instructions.
-- The app inserts the recipe row and then its children, and an update
-- deletes the children before inserting the replacement set. An immediate
-- minimum would reject those writes. A deferred minimum would still reject
-- a direct client that creates the recipe and the children in separate
-- requests. Those minimums stay in the form.
--
-- Collection caps use recipe_guard.recipe_collection_counts, not a count of
-- the child table. Under read committed, a count keeps the snapshot from
-- the start of the insert, including after waiting on a lock, so two
-- overlapping inserts can both observe the old total. The counter update
-- re-reads the latest committed value. Each child write locks its parent
-- recipe before the foreign key takes a key-share lock, so two inserts into
-- the same recipe wait instead of deadlocking. A move locks the lower recipe
-- id first. One statement that writes children for several recipes locks
-- those parents in row order; two such statements in opposite orders can
-- deadlock, and Postgres aborts one. That still cannot leave a collection
-- above 50.
--
-- Drizzle generated the table, the foreign key, the checks, and row-level
-- security. The schema, the backfill, the functions, and the triggers below
-- are custom: drizzle-kit does not emit them. Do not remove them on a later
-- generate.
--
-- The counter is derived. Triggers keep it aligned with child writes.
-- Direct insert, update, and delete of the counter is rejected, including
-- for the table owner, unless it comes from those triggers. A superuser can
-- still disable triggers. anon, authenticated, and authenticator have no
-- privileges on recipe_guard.
--
-- Existing rows that already exceed a limit stop this migration. Nothing is
-- truncated or deleted. Shorten the field or split the collection, then run
-- it again.
--
-- Rollback drops the triggers, functions, length checks, counter table, and
-- recipe_guard schema. Recipe text and child rows are untouched. Do that in
-- a transaction after reviewing the effect.

DO $$
DECLARE
  long_recipe_count bigint;
  long_instruction_count bigint;
  crowded_ingredient_count bigint;
  crowded_seasoning_count bigint;
  crowded_instruction_count bigint;
  recipe_ids text;
  instruction_ids text;
  ingredient_recipe_ids text;
  seasoning_recipe_ids text;
  instruction_recipe_ids text;
BEGIN
  SELECT count(*)
  INTO long_recipe_count
  FROM public.recipes
  WHERE char_length(description) > 5000;

  SELECT count(*)
  INTO long_instruction_count
  FROM public.instructions
  WHERE char_length(description) > 2000;

  SELECT count(*)
  INTO crowded_ingredient_count
  FROM (
    SELECT recipe_id
    FROM public.ingredients
    GROUP BY recipe_id
    HAVING count(*) > 50
  ) AS crowded;

  SELECT count(*)
  INTO crowded_seasoning_count
  FROM (
    SELECT recipe_id
    FROM public.seasonings
    GROUP BY recipe_id
    HAVING count(*) > 50
  ) AS crowded;

  SELECT count(*)
  INTO crowded_instruction_count
  FROM (
    SELECT recipe_id
    FROM public.instructions
    GROUP BY recipe_id
    HAVING count(*) > 50
  ) AS crowded;

  IF long_recipe_count = 0
    AND long_instruction_count = 0
    AND crowded_ingredient_count = 0
    AND crowded_seasoning_count = 0
    AND crowded_instruction_count = 0 THEN
    RETURN;
  END IF;

  SELECT string_agg(id::text, ', ' ORDER BY id)
  INTO recipe_ids
  FROM (
    SELECT id
    FROM public.recipes
    WHERE char_length(description) > 5000
    ORDER BY id
    LIMIT 10
  ) AS sample;

  SELECT string_agg(id::text, ', ' ORDER BY id)
  INTO instruction_ids
  FROM (
    SELECT id
    FROM public.instructions
    WHERE char_length(description) > 2000
    ORDER BY id
    LIMIT 10
  ) AS sample;

  SELECT string_agg(recipe_id::text, ', ' ORDER BY recipe_id)
  INTO ingredient_recipe_ids
  FROM (
    SELECT recipe_id
    FROM public.ingredients
    GROUP BY recipe_id
    HAVING count(*) > 50
    ORDER BY recipe_id
    LIMIT 10
  ) AS sample;

  SELECT string_agg(recipe_id::text, ', ' ORDER BY recipe_id)
  INTO seasoning_recipe_ids
  FROM (
    SELECT recipe_id
    FROM public.seasonings
    GROUP BY recipe_id
    HAVING count(*) > 50
    ORDER BY recipe_id
    LIMIT 10
  ) AS sample;

  SELECT string_agg(recipe_id::text, ', ' ORDER BY recipe_id)
  INTO instruction_recipe_ids
  FROM (
    SELECT recipe_id
    FROM public.instructions
    GROUP BY recipe_id
    HAVING count(*) > 50
    ORDER BY recipe_id
    LIMIT 10
  ) AS sample;

  RAISE EXCEPTION
    'Recipe validation refused to change existing data. Recipes with a description over 5000 characters: % (sample ids: %). Instructions over 2000 characters: % (sample ids: %). Recipes with more than 50 ingredients: % (sample recipe ids: %). Recipes with more than 50 seasonings: % (sample recipe ids: %). Recipes with more than 50 instructions: % (sample recipe ids: %). Shorten those fields or split those collections, then run this migration again. This migration does not truncate or delete rows.',
    long_recipe_count,
    coalesce(recipe_ids, 'none'),
    long_instruction_count,
    coalesce(instruction_ids, 'none'),
    crowded_ingredient_count,
    coalesce(ingredient_recipe_ids, 'none'),
    crowded_seasoning_count,
    coalesce(seasoning_recipe_ids, 'none'),
    crowded_instruction_count,
    coalesce(instruction_recipe_ids, 'none');
END $$;
--> statement-breakpoint
CREATE SCHEMA "recipe_guard";
--> statement-breakpoint
CREATE TABLE "recipe_guard"."recipe_collection_counts" (
	"recipe_id" integer PRIMARY KEY,
	"ingredient_count" integer DEFAULT 0 NOT NULL,
	"seasoning_count" integer DEFAULT 0 NOT NULL,
	"instruction_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "recipe_collection_counts_ingredient_count" CHECK ("ingredient_count" between 0 and 50),
	CONSTRAINT "recipe_collection_counts_seasoning_count" CHECK ("seasoning_count" between 0 and 50),
	CONSTRAINT "recipe_collection_counts_instruction_count" CHECK ("instruction_count" between 0 and 50)
);
--> statement-breakpoint
ALTER TABLE "recipe_guard"."recipe_collection_counts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipe_guard"."recipe_collection_counts" ADD CONSTRAINT "recipe_collection_counts_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_description_length" CHECK (char_length("description") <= 2000);
--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_description_length" CHECK (char_length("description") <= 5000);
--> statement-breakpoint
INSERT INTO "recipe_guard"."recipe_collection_counts" (
  "recipe_id",
  "ingredient_count",
  "seasoning_count",
  "instruction_count"
)
SELECT
  recipe.id,
  (
    SELECT count(*)
    FROM public.ingredients AS child
    WHERE child.recipe_id = recipe.id
  ),
  (
    SELECT count(*)
    FROM public.seasonings AS child
    WHERE child.recipe_id = recipe.id
  ),
  (
    SELECT count(*)
    FROM public.instructions AS child
    WHERE child.recipe_id = recipe.id
  )
FROM public.recipes AS recipe;
--> statement-breakpoint
CREATE FUNCTION recipe_guard.apply_recipe_child_delta(
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
  actor uuid;
  owner uuid;
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

  SELECT recipe.user_id
  INTO owner
  FROM public.recipes AS recipe
  WHERE recipe.id = target_recipe_id;

  IF NOT FOUND THEN
    IF missing_ok THEN
      RETURN;
    END IF;

    RAISE EXCEPTION 'recipe % does not exist', target_recipe_id
      USING ERRCODE = '23503';
  END IF;

  actor := auth.uid();

  -- The Next.js database role does not set auth.uid(). API roles do.
  -- A missing subject on those roles must not maintain another recipe.
  IF actor IS NULL AND session_user IN ('anon', 'authenticated', 'authenticator') THEN
    RAISE EXCEPTION 'recipe % is not available for this write', target_recipe_id
      USING ERRCODE = '42501';
  END IF;

  IF actor IS NOT NULL AND actor IS DISTINCT FROM owner THEN
    RAISE EXCEPTION 'recipe % is not available for this write', target_recipe_id
      USING ERRCODE = '42501';
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
CREATE FUNCTION recipe_guard.enforce_recipe_child_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_TABLE_NAME NOT IN ('ingredients', 'seasonings', 'instructions') THEN
    RAISE EXCEPTION 'recipe_guard.enforce_recipe_child_limit cannot run on %', TG_TABLE_NAME
      USING ERRCODE = '0A000';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.recipe_id IS NOT DISTINCT FROM OLD.recipe_id THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM recipe_guard.apply_recipe_child_delta(OLD.recipe_id, TG_TABLE_NAME, -1, true);
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM recipe_guard.apply_recipe_child_delta(NEW.recipe_id, TG_TABLE_NAME, 1, false);
    RETURN NEW;
  END IF;

  -- Moving a row. Lock the lower recipe id first so two moves cannot deadlock.
  IF OLD.recipe_id < NEW.recipe_id THEN
    PERFORM recipe_guard.apply_recipe_child_delta(OLD.recipe_id, TG_TABLE_NAME, -1, true);
    PERFORM recipe_guard.apply_recipe_child_delta(NEW.recipe_id, TG_TABLE_NAME, 1, false);
  ELSE
    PERFORM recipe_guard.apply_recipe_child_delta(NEW.recipe_id, TG_TABLE_NAME, 1, false);
    PERFORM recipe_guard.apply_recipe_child_delta(OLD.recipe_id, TG_TABLE_NAME, -1, true);
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION recipe_guard.create_recipe_collection_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO recipe_guard.recipe_collection_counts (recipe_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION recipe_guard.reject_direct_count_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  -- Depth 1 is a direct write. Trigger maintenance is nested and may pass.
  IF pg_trigger_depth() = 1 THEN
    RAISE EXCEPTION 'recipe collection counts are maintained by the database'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION recipe_guard.apply_recipe_child_delta(integer, text, integer, boolean) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION recipe_guard.enforce_recipe_child_limit() FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION recipe_guard.create_recipe_collection_counts() FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION recipe_guard.reject_direct_count_change() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER recipe_collection_counts_no_direct_write
BEFORE INSERT OR UPDATE OR DELETE ON recipe_guard.recipe_collection_counts
FOR EACH ROW
EXECUTE FUNCTION recipe_guard.reject_direct_count_change();
--> statement-breakpoint
CREATE TRIGGER recipes_create_collection_counts
AFTER INSERT ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION recipe_guard.create_recipe_collection_counts();
--> statement-breakpoint
CREATE TRIGGER ingredients_collection_limit
BEFORE INSERT OR UPDATE OR DELETE ON public.ingredients
FOR EACH ROW
EXECUTE FUNCTION recipe_guard.enforce_recipe_child_limit();
--> statement-breakpoint
CREATE TRIGGER seasonings_collection_limit
BEFORE INSERT OR UPDATE OR DELETE ON public.seasonings
FOR EACH ROW
EXECUTE FUNCTION recipe_guard.enforce_recipe_child_limit();
--> statement-breakpoint
CREATE TRIGGER instructions_collection_limit
BEFORE INSERT OR UPDATE OR DELETE ON public.instructions
FOR EACH ROW
EXECUTE FUNCTION recipe_guard.enforce_recipe_child_limit();
--> statement-breakpoint
REVOKE ALL ON SCHEMA recipe_guard FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON TABLE recipe_guard.recipe_collection_counts FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON SCHEMA recipe_guard FROM anon';
    EXECUTE 'REVOKE ALL ON TABLE recipe_guard.recipe_collection_counts FROM anon';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA recipe_guard FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON SCHEMA recipe_guard FROM authenticated';
    EXECUTE 'REVOKE ALL ON TABLE recipe_guard.recipe_collection_counts FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA recipe_guard FROM authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'REVOKE ALL ON SCHEMA recipe_guard FROM service_role';
    EXECUTE 'REVOKE ALL ON TABLE recipe_guard.recipe_collection_counts FROM service_role';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA recipe_guard FROM service_role';
  END IF;
END $$;
--> statement-breakpoint
COMMENT ON TABLE recipe_guard.recipe_collection_counts IS
  'Derived per-recipe child counts. Triggers maintain the row. Direct writes are rejected. Each count must stay between 0 and 50.';
--> statement-breakpoint
COMMENT ON FUNCTION recipe_guard.enforce_recipe_child_limit() IS
  'Serializes child inserts, deletes, and recipe moves through the collection counter.';
