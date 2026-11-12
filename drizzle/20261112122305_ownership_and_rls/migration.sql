-- Drop recipes that have no owner so user_id can become NOT NULL.
-- Child ingredient, seasoning, and instruction rows follow the existing
-- ON DELETE CASCADE. Recipes that already name a user are kept.
-- If one of those users is missing from auth.users, stop rather than
-- reassign or delete that recipe.
DO $$
DECLARE
  auth_user_count bigint;
  dangling_recipe_count bigint;
BEGIN
  SELECT count(*) INTO auth_user_count FROM auth.users;

  SELECT count(*) INTO dangling_recipe_count
  FROM public.recipes AS recipe
  WHERE recipe.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM auth.users AS account
      WHERE account.id = recipe.user_id
    );

  IF dangling_recipe_count > 0 THEN
    RAISE EXCEPTION
      'recipes.user_id has % value(s) that are not in auth.users. Fix those rows before adding the foreign key. This migration only deletes recipes whose user_id is null.',
      dangling_recipe_count;
  END IF;

  IF auth_user_count = 0 AND (
    EXISTS (SELECT 1 FROM public.recipe_likes)
    OR EXISTS (SELECT 1 FROM public.recipe_bookmarks)
  ) THEN
    RAISE EXCEPTION
      'auth.users is empty but likes or bookmarks exist. Refusing to delete them.';
  END IF;
END $$;
--> statement-breakpoint
DELETE FROM "recipes" WHERE "user_id" IS NULL;
--> statement-breakpoint
DELETE FROM "recipe_likes"
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users
  WHERE auth.users.id = "recipe_likes"."user_id"
);
--> statement-breakpoint
DELETE FROM "recipe_bookmarks"
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users
  WHERE auth.users.id = "recipe_bookmarks"."user_id"
);
--> statement-breakpoint
ALTER TABLE "ingredients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "instructions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipe_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seasonings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" ADD CONSTRAINT "recipe_bookmarks_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "ingredients_public_read" ON "ingredients" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "ingredients_insert_own" ON "ingredients" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "ingredients"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "ingredients_update_own" ON "ingredients" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "ingredients"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  )) WITH CHECK (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "ingredients"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "ingredients_delete_own" ON "ingredients" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "ingredients"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "instructions_public_read" ON "instructions" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "instructions_insert_own" ON "instructions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "instructions"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "instructions_update_own" ON "instructions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "instructions"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  )) WITH CHECK (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "instructions"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "instructions_delete_own" ON "instructions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "instructions"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "recipe_bookmarks_select_own" ON "recipe_bookmarks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("recipe_bookmarks"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recipe_bookmarks_insert_own" ON "recipe_bookmarks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("recipe_bookmarks"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recipe_bookmarks_delete_own" ON "recipe_bookmarks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("recipe_bookmarks"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recipe_likes_select_own" ON "recipe_likes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("recipe_likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recipe_likes_insert_own" ON "recipe_likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("recipe_likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recipe_likes_delete_own" ON "recipe_likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("recipe_likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recipes_public_read" ON "recipes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "recipes_insert_own" ON "recipes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("recipes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recipes_update_own" ON "recipes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("recipes"."user_id" = (select auth.uid())) WITH CHECK ("recipes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recipes_delete_own" ON "recipes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("recipes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "seasonings_public_read" ON "seasonings" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "seasonings_insert_own" ON "seasonings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "seasonings"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "seasonings_update_own" ON "seasonings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "seasonings"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  )) WITH CHECK (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "seasonings"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "seasonings_delete_own" ON "seasonings" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "recipes"
    where "recipes"."id" = "seasonings"."recipe_id"
      and "recipes"."user_id" = (select auth.uid())
  ));
--> statement-breakpoint
ALTER TABLE "ingredients" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "instructions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipe_likes" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recipes" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "seasonings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "recipes" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "recipes" TO "anon", "authenticated";
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "recipes" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON TABLE "ingredients" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "ingredients" TO "anon", "authenticated";
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "ingredients" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON TABLE "instructions" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "instructions" TO "anon", "authenticated";
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "instructions" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON TABLE "seasonings" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "seasonings" TO "anon", "authenticated";
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "seasonings" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON TABLE "recipe_likes" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE "recipe_likes" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON TABLE "recipe_bookmarks" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE "recipe_bookmarks" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON SEQUENCE "recipes_id_seq" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "recipes_id_seq" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON SEQUENCE "ingredients_id_seq" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "ingredients_id_seq" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON SEQUENCE "instructions_id_seq" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "instructions_id_seq" TO "authenticated";
--> statement-breakpoint
REVOKE ALL ON SEQUENCE "seasonings_id_seq" FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "seasonings_id_seq" TO "authenticated";