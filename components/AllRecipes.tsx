import { getAllRecipes } from "@/app/actions/recipes";
import RecipeCard from "./RecipeCard";

const AllRecipes = async () => {
    const recipesData: Recipes[] = await getAllRecipes();

    return (
        <div className="container mx-auto">
            <div className="py-6">
                <h2 className="text-2xl font-bold">All Recipes</h2>
                <p className="text-gray-600 text-lg">
                    You can find all recipes here.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipesData.map((recipe) => (
                    <RecipeCard key={recipe.id} {...recipe} />
                ))}
            </div>
        </div>
    );
};

export default AllRecipes;
