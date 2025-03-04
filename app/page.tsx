import Hero from "@/components/Hero";
import RecipesGrid from "@/components/RecipesGrid";
import { getAllRecipes } from "./actions/recipes";
import { Recipe } from "@/types";

export default async function Home() {
    const recipesData: Recipe[] = (await getAllRecipes()) || [];

    const sortByLikes = (a: Recipe, b: Recipe) => {
        return b.likes - a.likes;
    };

    return (
        <main className="container mx-auto">
            {/* Hero section */}
            <Hero />

            {/* Hot recipes */}
            <h2 className="text-2xl font-bold mb-6">Hot Recipes</h2>
            <RecipesGrid
                recipes={recipesData}
                likesCount={2}
                sortingMethod={sortByLikes}
            />

            {/* category? */}
        </main>
    );
}
