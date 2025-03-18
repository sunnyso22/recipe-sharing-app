import Hero from "@/components/Hero";
import RecipesGrid from "@/components/RecipesGrid";
import { getHotRecipes } from "../actions/recipes";
import { Recipe } from "@/types";

export default async function Home() {
    const recipesData: Recipe[] = (await getHotRecipes(2)) || [];

    return (
        <main className="container mx-auto">
            {/* Hero section */}
            <Hero />

            {/* Hot recipes */}
            <h2 className="text-2xl font-bold mb-6">Hot Recipes</h2>
            <RecipesGrid recipes={recipesData} />

            {/* category? */}
        </main>
    );
}
