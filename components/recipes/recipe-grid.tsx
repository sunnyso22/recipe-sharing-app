import {
  RecipeCard,
  RecipeCardSkeleton,
} from "@/components/recipes/recipe-card";
import {
  listRecipes,
  listRecipesByUser,
  searchRecipes,
} from "@/db/queries/recipes";
import { readSearchQuery } from "@/lib/recipes";

const RecipeGrid = async ({
  searchParams,
  userId,
  emptyMessage = "No recipes yet.",
}: {
  searchParams: PageProps<"/recipes">["searchParams"];
  userId?: string;
  emptyMessage?: string;
}) => {
  const query = readSearchQuery((await searchParams).q);
  const items = userId
    ? query
      ? await searchRecipes(query, userId)
      : await listRecipesByUser(userId)
    : query
      ? await searchRecipes(query)
      : await listRecipes();

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

  const list = (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((recipe, index) => (
        <li key={recipe.id}>
          <RecipeCard
            id={recipe.id}
            title={recipe.title}
            eager={index === 0}
          />
        </li>
      ))}
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
