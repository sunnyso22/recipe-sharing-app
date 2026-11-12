import { RecipeCatalog } from "@/components/recipes/recipe-catalog";
import { RecipeGrid } from "@/components/recipes/recipe-grid";

export const metadata = {
  title: "Recipes",
};

const RecipesPage = ({ searchParams }: PageProps<"/recipes">) => {
  return (
    <RecipeCatalog
      title="Recipes"
      description="Browse dishes shared from kitchens near and far."
    >
      <RecipeGrid searchParams={searchParams} />
    </RecipeCatalog>
  );
};

export default RecipesPage;
