import { ObjectId } from "mongodb";
import RecipeCard from "./RecipeCard";
import { Recipe } from "@/types";

const RecipesGrid = async ({ recipes }: { recipes: Recipe[] }) => {
    return (
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
                <RecipeCard
                    key={(recipe._id as ObjectId).toString()}
                    {...recipe}
                />
            ))}
        </div>
    );
};

export default RecipesGrid;
