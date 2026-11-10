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
import { requireAuthUser } from "@/lib/auth/session";

export const metadata = {
  title: "Cookbook",
};

const CookbookList = async ({
  searchParams,
}: {
  searchParams: PageProps<"/cookbook">["searchParams"];
}) => {
  const user = await requireAuthUser();

  return (
    <RecipeGrid
      searchParams={searchParams}
      userId={user.id}
      emptyMessage="You have not added a recipe yet. Recipes you save while signed in show up here."
    />
  );
};

const CookbookPage = ({ searchParams }: PageProps<"/cookbook">) => {
  return (
    <PageMain>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl tracking-tight">Cookbook</h1>
          <p className="text-muted-foreground">
            Manage the recipes you have created.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <CookbookList searchParams={searchParams} />
      </Suspense>
    </PageMain>
  );
};

export default CookbookPage;
