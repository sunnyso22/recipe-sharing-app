import { Recipe } from "@/types";
import RecipeCard from "./RecipeCard";

type RecipesGridProps = {
    recipes: Recipe[];
    likesCount: number;
    sortingMethod?: (a: Recipe, b: Recipe) => number;
};

const RecipesGrid = async ({
    recipes,
    likesCount,
    sortingMethod,
}: RecipesGridProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes
                .filter((item) => item.likes >= likesCount)
                .sort(sortingMethod)
                .map((recipe) => (
                    <RecipeCard key={recipe._id.toString()} {...recipe} />
                ))}
        </div>
    );
};

export default RecipesGrid;
