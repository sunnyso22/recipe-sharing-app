import RecipeCard from "./RecipeCard";
import { Recipe } from "@/types";

type RecipesGridProps = {
    recipes: Recipe[];
};

const RecipesGrid = async ({ recipes }: RecipesGridProps) => {
    return (
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
                <RecipeCard key={recipe._id.toString()} {...recipe} />
            ))}
        </div>
    );
};

export default RecipesGrid;
