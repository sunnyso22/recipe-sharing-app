import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import { buttonVariants } from "@/components/ui/button";
import { listRecipesByUser } from "@/db/queries/recipes";
import { requireAuthUser } from "@/lib/auth/session";

export const metadata = {
  title: "Cookbook",
};

const CookbookList = async () => {
  const user = await requireAuthUser();
  const recipes = await listRecipesByUser(user.id);

  if (recipes.length === 0) {
    return (
      <p className="text-muted-foreground">
        You have not added a recipe yet. Recipes you save while signed in show
        up here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y overflow-hidden rounded-4xl bg-card ring-1 ring-foreground/10">
      {recipes.map((recipe) => (
        <li
          key={recipe.id}
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        >
          <Link
            href={`/recipes/${recipe.id}`}
            className="font-heading text-lg tracking-tight underline-offset-4 hover:underline"
          >
            {recipe.title}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Edit
            </Link>
            <DeleteRecipeButton
              recipeId={recipe.id}
              redirectTo="/cookbook"
              size="sm"
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

const CookbookPage = () => {
  return (
    <PageMain>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl tracking-tight">Cookbook</h1>
          <p className="text-muted-foreground">
            Manage the recipes you have created.
          </p>
        </div>
        <Link href="/recipes/new" className={buttonVariants()}>
          <Plus />
          Add recipe
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-4xl bg-muted" aria-hidden />
        }
      >
        <CookbookList />
      </Suspense>
    </PageMain>
  );
};

export default CookbookPage;
