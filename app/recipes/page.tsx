import { getAllRecipes } from "@/app/actions/recipes";
import RecipesGrid from "@/components/RecipesGrid";
import SearchBar from "@/components/SearchBar";
import { Recipe } from "@/types";

const Recipes = async ({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>;
}) => {
    const { search } = await searchParams;
    const recipesData: Recipe[] = (await getAllRecipes(search)) || [];

    const sortByAlphabet = (a: Recipe, b: Recipe) => {
        if (a.title > b.title) return 1;
        if (a.title < b.title) return -1;
        return 0;
    };

    return (
        <div className="container mx-auto">
            <div className="flex w-full items-center justify-between">
                <div className="py-6">
                    <h2 className="text-2xl font-bold">All Recipes</h2>
                    <p className="text-paragraph text-lg">
                        You can find all recipes here.
                    </p>
                </div>
                <SearchBar searchString={search || ""} />
            </div>
            <RecipesGrid
                recipes={recipesData}
                likesCount={0}
                sortingMethod={sortByAlphabet}
            />
        </div>
    );
};

export default Recipes;
