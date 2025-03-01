import { getAllRecipes } from "@/app/actions/recipes";
import RecipeCard from "./RecipeCard";

const HotRecipes = async () => {
    const recipesData: Recipes[] = await getAllRecipes();

    return (
        <div className="container mx-auto">
            <h2 className="text-2xl font-bold mb-6">Hot Recipes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipesData.map((recipe) => (
                    <RecipeCard key={recipe.id} {...recipe} />
                ))}
            </div>
        </div>
    );
};

export default HotRecipes;
