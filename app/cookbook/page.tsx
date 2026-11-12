import { Plus } from "lucide-react";
import Link from "next/link";

import { RecipeCatalog } from "@/components/recipes/recipe-catalog";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
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
    <RecipeCatalog
      title="Cookbook"
      description="Manage the recipes you have created."
      action={
        <Link href="/recipes/new" className={buttonVariants()}>
          <Plus />
          Add recipe
        </Link>
      }
    >
      <CookbookList searchParams={searchParams} />
    </RecipeCatalog>
  );
};

export default CookbookPage;
