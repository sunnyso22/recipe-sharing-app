CREATE TABLE "ingredients" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingredients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipe_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "instructions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipe_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_bookmarks" (
	"user_id" uuid,
	"recipe_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_bookmarks_pkey" PRIMARY KEY("user_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_likes" (
	"user_id" uuid,
	"recipe_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_likes_pkey" PRIMARY KEY("user_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recipes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasonings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seasonings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipe_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ingredients_recipe_id_idx" ON "ingredients" ("recipe_id");--> statement-breakpoint
CREATE INDEX "instructions_recipe_id_idx" ON "instructions" ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_bookmarks_recipe_id_idx" ON "recipe_bookmarks" ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_likes_recipe_id_idx" ON "recipe_likes" ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipes_user_id_idx" ON "recipes" ("user_id");--> statement-breakpoint
CREATE INDEX "seasonings_recipe_id_idx" ON "seasonings" ("recipe_id");--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_bookmarks" ADD CONSTRAINT "recipe_bookmarks_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "seasonings" ADD CONSTRAINT "seasonings_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;