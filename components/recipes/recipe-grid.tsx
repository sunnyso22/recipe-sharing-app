import {
  RecipeCard,
  RecipeCardSkeleton,
} from "@/components/recipes/recipe-card";
import { listRecipes } from "@/db/queries/recipes";

const RecipeGrid = async () => {
  const recipes = await listRecipes();

  if (recipes.length === 0) {
    return <p className="text-muted-foreground">No recipes yet.</p>;
  }

  return (
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
