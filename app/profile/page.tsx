import RecipesGrid from "@/components/RecipesGrid";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types";
import { currentUser } from "@clerk/nextjs/server";
import { getRecipeById, getUserRecipes } from "../../actions/recipes";
import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { ObjectId } from "mongodb";
import TabsNavigation from "@/components/TabsNavigation";

const ProfilePage = async ({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) => {
    const activeTab = (await searchParams).tab || "Your Recipes";

    const user = await currentUser();
    if (!user) throw new Error("No user is logged in to view profile page!");

    const recipesData: Recipe[] =
        (await getUserRecipes(user.fullName || "")) || [];

    const bookmarkedRecipes: Recipe[] = await Promise.all(
        (user.publicMetadata.bookmarks as string[]).map(
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
    console.log(bookmarkedRecipes.length);

    return (
        <div className="container mx-auto">
            <div className="flex w-full items-center justify-between">
                <div className="py-6">
                    <h2 className="text-2xl font-bold">
                        Hi, {user.firstName}{" "}
                    </h2>
                    <p className="text-paragraph text-lg">
                        You can find your published and bookmarked recipes here.
                    </p>
                </div>
                <Link href="/profile/write">
                    <Button variant="secondary">
                        <NotebookPen />
                        Write Recipes
                    </Button>
                </Link>
            </div>

            <TabsNavigation activeTab={activeTab} />
            {activeTab === "Your Recipes" &&
                (recipesData.length > 0 ? (
                    <RecipesGrid recipes={recipesData} />
                ) : (
                    <div className="h-[70vh] flex items-center justify-center">
                        <h2 className="text-2xl font-bold">
                            You have not yet published any recipes!
                        </h2>
                    </div>
                ))}
            {activeTab === "Bookmarks" &&
                (bookmarkedRecipes.length > 0 ? (
                    <RecipesGrid recipes={bookmarkedRecipes} />
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

export default ProfilePage;
