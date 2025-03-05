import { Recipe } from "@/types";
import RecipeCard from "./RecipeCard";
import { currentUser } from "@clerk/nextjs/server";

type RecipesGridProps = {
    recipes: Recipe[];
};

const RecipesGrid = async ({ recipes }: RecipesGridProps) => {
    const user = await currentUser();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
                <RecipeCard key={recipe._id.toString()} {...recipe} />
            ))}
        </div>
    );
};

export default RecipesGrid;
