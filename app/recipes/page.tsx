import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import {
  RecipeGrid,
  RecipeGridSkeleton,
} from "@/components/recipes/recipe-grid";
import {
  RecipeSearchForm,
  RecipeSearchFormFallback,
} from "@/components/recipes/recipe-search";

export const metadata = {
  title: "Recipes",
};

const RecipesPage = ({ searchParams }: PageProps<"/recipes">) => {
  return (
    <PageMain>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-4xl tracking-tight">Recipes</h1>
        <div className="flex items-center gap-2">
          <Suspense fallback={<RecipeSearchFormFallback />}>
            <RecipeSearchForm />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={<RecipeGridSkeleton />}>
        <RecipeGrid searchParams={searchParams} />
      </Suspense>
    </PageMain>
  );
};

export default RecipesPage;
