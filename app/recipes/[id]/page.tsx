import { ArrowLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import {
  RecipeDetail,
  RecipeDetailSkeleton,
} from "@/components/recipes/recipe-detail";
import { buttonVariants } from "@/components/ui/button";
import { getRecipe } from "@/db/queries/recipes";
import { parseRecipeId } from "@/lib/recipes";
import { cn } from "@/lib/utils";

export const generateMetadata = async ({
  params,
}: PageProps<"/recipes/[id]">): Promise<Metadata> => {
  const { id } = await params;
  const recipeId = parseRecipeId(id);

  if (recipeId === null) {
    return { title: "Recipe" };
  }

  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    return { title: "Recipe" };
  }

  return {
    title: recipe.title,
    description: recipe.description,
  };
};

const RecipeActions = async ({
  params,
}: {
  params: PageProps<"/recipes/[id]">["params"];
}) => {
  const { id } = await params;
  const recipeId = parseRecipeId(id);

  if (recipeId === null) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href={`/recipes/${recipeId}/edit`}
        className={buttonVariants({ variant: "outline" })}
      >
        <Pencil />
        Update
      </Link>
      <DeleteRecipeButton recipeId={recipeId} />
    </div>
  );
};

const RecipePage = ({ params }: PageProps<"/recipes/[id]">) => {
  return (
    <PageMain>
      <div className="flex items-start justify-between gap-4">
        <Link
          href="/recipes"
          className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 w-fit")}
        >
          <ArrowLeft />
          Back
        </Link>
        <Suspense fallback={null}>
          <RecipeActions params={params} />
        </Suspense>
      </div>
      <Suspense fallback={<RecipeDetailSkeleton />}>
        <RecipeDetail params={params} />
      </Suspense>
    </PageMain>
  );
};

export default RecipePage;
