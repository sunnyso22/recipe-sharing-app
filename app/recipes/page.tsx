import { Plus } from "lucide-react";
import Link from "next/link";
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
import { buttonVariants } from "@/components/ui/button";

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
          <Link href="/recipes/new" className={buttonVariants()}>
            <Plus />
            Add recipe
          </Link>
        </div>
      </div>
      <Suspense fallback={<RecipeGridSkeleton />}>
        <RecipeGrid searchParams={searchParams} />
      </Suspense>
    </PageMain>
  );
};

export default RecipesPage;
