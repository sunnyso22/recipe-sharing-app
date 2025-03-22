import { ObjectId } from "mongodb";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { NotebookPen } from "lucide-react";
import { getRecipeById, getUserRecipes } from "../../actions/recipes";
import RecipesGrid from "@/components/RecipesGrid";
import { Button } from "@/components/ui/button";
import TabsNavigation from "@/components/TabsNavigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Recipe } from "@/types";

const CookbookPage = async ({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) => {
    const activeTab = (await searchParams).tab || "My Recipes";

    const user = await currentUser();
    if (!user) throw new Error("No user is logged in to view cookbook page!");

    const userRecipes: Recipe[] =
        (await getUserRecipes(user.fullName || "")) || [];

    const bookmarkedRecipes: Recipe[] = await Promise.all(
        ((user.publicMetadata.bookmarks as string[]) || []).map(
            async (id) =>
                (await getRecipeById(id)) || {
                    _id: new ObjectId(),
                    author: { name: "", image: "" },
                    likes: 0,
                    image: "",
                    title: "",
                    description: "",
                    ingredients: [],
                    seasonings: [],
                    instructions: [],
                }
        )
    );

    return (
        <div className="container mx-auto">
            <div className="flex w-full items-center justify-between">
                <div className="py-6">
                    <h2 className="text-2xl font-bold">
                        Hi, {user.firstName}. Here is your cookbook!
                    </h2>
                    <p className="text-paragraph text-lg">
                        You can find your published and bookmarked recipes here.
                    </p>
                </div>
                <Link href="/cookbook/write">
                    <Button variant="secondary">
                        <NotebookPen />
                        Write Recipes
                    </Button>
                </Link>
            </div>

            <TabsNavigation activeTab={activeTab} />
            {activeTab === "My Recipes" &&
                (userRecipes.length > 0 ? (
                    <Suspense fallback={<LoadingSpinner />}>
                        <RecipesGrid recipes={userRecipes} />
                    </Suspense>
                ) : (
                    <div className="h-[70vh] flex items-center justify-center">
                        <h2 className="text-2xl font-bold">
                            You have not yet published any recipes!
                        </h2>
                    </div>
                ))}
            {activeTab === "Bookmarks" &&
                (bookmarkedRecipes.length > 0 ? (
                    <Suspense fallback={<LoadingSpinner />}>
                        <RecipesGrid recipes={bookmarkedRecipes} />
                    </Suspense>
                ) : (
                    <div className="h-[70vh] flex items-center justify-center">
                        <h2 className="text-2xl font-bold">
                            You have not yet bookemarked any recipes!
                        </h2>
                    </div>
                ))}
        </div>
    );
};

export default CookbookPage;
