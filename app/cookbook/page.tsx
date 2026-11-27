import { Plus } from "lucide-react";
import Link from "next/link";

import { RecipeCatalog } from "@/components/recipes/recipe-catalog";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { buttonVariants } from "@/components/ui/button";
import { requireAuthUser } from "@/lib/auth/session";

const cookbookReturnPath = (
  params: Record<string, string | string[] | undefined>,
) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;

    if (typeof first === "string") {
      search.append(key, first);
    }
  }

  const query = search.toString();
  return query.length > 0 ? `/cookbook?${query}` : "/cookbook";
};

export const metadata = {
  title: "Cookbook",
};

const CookbookList = async ({
  searchParams,
}: {
  searchParams: PageProps<"/cookbook">["searchParams"];
}) => {
  const params = await searchParams;
  const user = await requireAuthUser(cookbookReturnPath(params));

  return (
    <RecipeGrid
      pathname="/cookbook"
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

export { CookbookList };
export default CookbookPage;
