import {
  RecipeCard,
  RecipeCardSkeleton,
} from "@/components/recipes/recipe-card";
import { listRecipes, searchRecipes } from "@/db/queries/recipes";
import { readSearchQuery } from "@/lib/recipes";

const RecipeGrid = async ({
  searchParams,
}: {
  searchParams: PageProps<"/recipes">["searchParams"];
}) => {
  const query = readSearchQuery((await searchParams).q);
  const recipes = query ? await searchRecipes(query) : await listRecipes();

  if (recipes.length === 0) {
    return (
      <p className="text-muted-foreground">
        {query
          ? `No recipes match “${query}”. Try a different name or a word from the description.`
          : "No recipes yet."}
      </p>
    );
  }

  const countLabel =
    recipes.length === 1 ? "1 recipe" : `${recipes.length} recipes`;

  return (
    <div className="flex flex-col gap-8">
      {query ? (
        <p className="text-muted-foreground">
          {countLabel} for “{query}”
        </p>
      ) : null}
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe, index) => (
          <li key={recipe.id}>
            <RecipeCard
              id={recipe.id}
              title={recipe.title}
              eager={index === 0}
            />
          </li>
        ))}
      </ul>
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
