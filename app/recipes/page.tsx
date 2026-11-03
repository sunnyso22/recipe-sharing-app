import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import {
  RecipeGrid,
  RecipeGridSkeleton,
} from "@/components/recipes/recipe-grid";

export const metadata = {
  title: "Recipes",
};

const RecipesPage = () => {
  return (
    <PageMain>
      <h1 className="font-heading text-4xl tracking-tight">Recipes</h1>
      <Suspense fallback={<RecipeGridSkeleton />}>
        <RecipeGrid />
      </Suspense>
    </PageMain>
  );
};

export default RecipesPage;
