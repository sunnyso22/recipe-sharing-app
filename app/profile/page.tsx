import RecipesGrid from "@/components/RecipesGrid";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types";
import { currentUser } from "@clerk/nextjs/server";
import { getUserRecipes } from "../actions/recipes";
import Link from "next/link";

const ProfilePage = async () => {
    const user = await currentUser();

    const recipesData: Recipe[] =
        (await getUserRecipes(user?.fullName || "")) || [];

    return (
        <div className="container mx-auto">
            <div className="flex w-full items-center justify-between">
                <div className="py-6">
                    <h2 className="text-2xl font-bold">
                        Hi, {user?.firstName}{" "}
                    </h2>
                    <p className="text-paragraph text-lg">
                        You can find your published and bookmarked recipes here.
                    </p>
                </div>
                <Link href="/profile/write">
                    <Button variant="secondary">Write Recipes</Button>
                </Link>
            </div>
            <div className="flex gap-6 py-6">
                <Button>Your Recipes</Button>
                <Button>Bookmark</Button>
            </div>

            {recipesData.length > 0 ? (
                <RecipesGrid recipes={recipesData} />
            ) : (
                <div className="h-[70vh] flex items-center justify-center">
                    <h2 className="text-2xl font-bold">
                        You have not yet published any recipes!
                    </h2>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
