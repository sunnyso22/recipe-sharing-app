import { redirect } from "next/navigation";

import {
  RecipeCard,
  RecipeCardSkeleton,
} from "@/components/recipes/recipe-card";
import {
  RecipePageNotice,
  RecipePagination,
  RecipeSearchCount,
} from "@/components/recipes/recipe-pagination";
import { getEngagementByRecipeIds } from "@/db/queries/engagement";
import {
  loadRecipeListPage,
  type RecipeListScope,
} from "@/db/queries/recipes";
import { getAuthUser } from "@/lib/auth/session";
import { readSearchQuery } from "@/lib/recipes";
import {
  readRecipePage,
  recipeListHref,
  type RecipeListPath,
  recipeListView,
} from "@/lib/recipes/pagination";

type RecipeListSearchParams = Promise<{
  q?: string | string[];
  page?: string | string[];
}>;

const RecipeGrid = async ({
  searchParams,
  pathname,
  userId,
  source = userId ? "owned" : "all",
  emptyMessage = "No recipes yet.",
}: {
  searchParams: RecipeListSearchParams;
  pathname: RecipeListPath;
  userId?: string;
  source?: RecipeListScope["source"];
  emptyMessage?: string;
}) => {
  const params = await searchParams;
  const query = readSearchQuery(params.q);
  const requested = readRecipePage(params.page);

  if (requested.status === "invalid") {
    redirect(recipeListHref(pathname, query, 1));
  }

  const page = requested.status === "page" ? requested.page : null;
  const [loaded, viewerId] = await Promise.all([
    loadRecipeListPage({ source, query, userId }, page),
    page === null || userId
      ? Promise.resolve(userId)
      : getAuthUser().then((user) => user?.id),
  ]);
  const view = recipeListView(loaded.total, requested);
  const emptyCopy = query
    ? `No recipes match “${query}”. Try a different name or a word from the description.`
    : emptyMessage;

  if (view.status === "empty") {
    return <p className="text-muted-foreground">{emptyCopy}</p>;
  }

  if (view.status === "out-of-range") {
    const notice = <RecipePageNotice pathname={pathname} query={query} />;

    if (!query) {
      return notice;
    }

    return (
      <div className="flex flex-col gap-8">
        <RecipeSearchCount query={query} total={view.total} />
        {notice}
      </div>
    );
  }

  const engagementByRecipe = await getEngagementByRecipeIds(
    loaded.items.map((recipe) => recipe.id),
    viewerId,
  );
  const list = (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {loaded.items.map((recipe, index) => {
        const engagement = engagementByRecipe.get(recipe.id);

        return (
          <li key={recipe.id}>
            <RecipeCard
              id={recipe.id}
              title={recipe.title}
              likeCount={engagement?.likeCount ?? 0}
              liked={engagement?.liked ?? false}
              bookmarked={engagement?.bookmarked ?? false}
              eager={index === 0}
            />
          </li>
        );
      })}
    </ul>
  );
  const pager = (
    <RecipePagination
      pathname={pathname}
      query={query}
      page={view.page}
      totalPages={view.totalPages}
    />
  );

  if (!query && view.totalPages <= 1) {
    return list;
  }

  return (
    <div className="flex flex-col gap-8">
      {query ? <RecipeSearchCount query={query} total={view.total} /> : null}
      {list}
      {pager}
    </div>
  );
};

const RecipeGridSkeleton = () => {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index}>
          <RecipeCardSkeleton />
        </li>
      ))}
    </ul>
  );
};

export { RecipeGrid, RecipeGridSkeleton };
