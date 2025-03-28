import { Suspense } from "react";
import { Metadata } from "next";
import { getAllRecipes } from "@/actions/recipes";
import RecipesGrid from "@/components/RecipesGrid";
import LoadingSpinner from "@/components/LoadingSpinner";
import SearchBar from "@/components/SearchBar";
import { Recipe } from "@/types";

export const metadata: Metadata = {
    title: "Recipes",
};

const Recipes = async ({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>;
}) => {
    const { search } = await searchParams;
    const recipesData: Recipe[] = (await getAllRecipes(search)) || [];

    return (
        <div className="container mx-auto">
            <div className="py-6 flex flex-col md:flex-row w-full items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start">
                    <h2 className="text-2xl font-bold">All Recipes</h2>
                    <p className="text-paragraph text-lg">
                        You can find all recipes here.
                    </p>
                </div>
                <SearchBar />
            </div>
            {recipesData.length > 0 ? (
                <Suspense
                    fallback={
                        <div className="h-[70vh] flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    }
                >
                    <RecipesGrid recipes={recipesData} />
                </Suspense>
            ) : (
                <div className="h-[70vh] flex items-center justify-center">
                    <h2 className="text-2xl font-bold">
                        No recipes could be found!
                    </h2>
                </div>
            )}
        </div>
    );
};

export default Recipes;
