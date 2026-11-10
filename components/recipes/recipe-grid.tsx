import {
  RecipeCard,
  RecipeCardSkeleton,
} from "@/components/recipes/recipe-card";
import { getEngagementByRecipeIds } from "@/db/queries/engagement";
import {
  listBookmarkedRecipes,
  listRecipes,
  listRecipesByUser,
  searchBookmarkedRecipes,
  searchRecipes,
} from "@/db/queries/recipes";
import { getAuthUser } from "@/lib/auth/session";
import { readSearchQuery } from "@/lib/recipes";

type RecipeGridSource = "all" | "owned" | "bookmarked";

const loadRecipes = ({
  query,
  userId,
  source,
}: {
  query: string;
  userId?: string;
  source: RecipeGridSource;
}) => {
  if (source === "bookmarked" && userId) {
    return query
      ? searchBookmarkedRecipes(query, userId)
      : listBookmarkedRecipes(userId);
  }

  if (source === "owned" && userId) {
    return query ? searchRecipes(query, userId) : listRecipesByUser(userId);
  }

  return query ? searchRecipes(query) : listRecipes();
};

const RecipeGrid = async ({
  searchParams,
  userId,
  source = userId ? "owned" : "all",
  emptyMessage = "No recipes yet.",
}: {
  searchParams: PageProps<"/recipes">["searchParams"];
  userId?: string;
  source?: RecipeGridSource;
  emptyMessage?: string;
}) => {
  const query = readSearchQuery((await searchParams).q);
  const [items, viewerId] = await Promise.all([
    loadRecipes({ query, userId, source }),
    userId ? Promise.resolve(userId) : getAuthUser().then((user) => user?.id),
  ]);

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        {query
          ? `No recipes match “${query}”. Try a different name or a word from the description.`
          : emptyMessage}
      </p>
    );
  }

  const countLabel = items.length === 1 ? "1 recipe" : `${items.length} recipes`;
  const engagementByRecipe = await getEngagementByRecipeIds(
    items.map((recipe) => recipe.id),
    viewerId,
  );

  const list = (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((recipe, index) => {
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

  if (!query) {
    return list;
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-muted-foreground">
        {countLabel} for “{query}”
      </p>
      {list}
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
