import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { PageMain } from "@/components/page-main";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import {
  RecipeDetail,
  RecipeDetailSkeleton,
} from "@/components/recipes/recipe-detail";
import { buttonVariants } from "@/components/ui/button";
import { getRecipeByParam } from "@/db/queries/recipes";
import { getManageableRecipe } from "@/lib/recipes/access";

export const generateMetadata = async ({
  params,
}: PageProps<"/recipes/[id]">): Promise<Metadata> => {
  const { id } = await params;
  const recipe = await getRecipeByParam(id);

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
  const recipe = await getManageableRecipe(id);

  if (!recipe) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href={`/recipes/${recipe.id}/edit`}
        className={buttonVariants({ variant: "outline" })}
      >
        <Pencil />
        Update
      </Link>
      <DeleteRecipeButton recipeId={recipe.id} />
    </div>
  );
};

const RecipePage = ({ params }: PageProps<"/recipes/[id]">) => {
  return (
    <PageMain>
      <div className="flex items-start justify-between gap-4">
        <BackLink href="/recipes" />
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
