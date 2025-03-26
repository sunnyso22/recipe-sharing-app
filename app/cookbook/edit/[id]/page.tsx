import { ObjectId } from "mongodb";
import { Metadata } from "next";
import { getAllRecipes, getRecipeById } from "@/actions/recipes";
import RecipeUploadForm from "@/components/uploadRecipe/RecipeUploadForm";
import { Recipe } from "@/types";

export const generateMetadata = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> => {
    const { id } = await params;
    const recipeData = await getRecipeById(id);
    if (!recipeData) {
        throw new Error("Recipe not found");
    }
    return { title: `Edit: ${recipeData.title}` };
};

export const generateStaticParams = async () => {
    const recipeData: Recipe[] = (await getAllRecipes()) || [];
    return recipeData.map((recipe) => ({
        id: (recipe._id as ObjectId).toString(),
    }));
};

const EditRecipePage = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;

    const recipeData = await getRecipeById(id);
    if (!recipeData) {
        throw new Error("Recipe not found");
    }

    return (
        <div className="container mx-auto">
            <div className="py-6">
                <h2 className="text-2xl font-bold">Edit Recipe</h2>
                <p className="text-paragraph text-lg">
                    You can edit your recipe here.
                </p>
            </div>
            <RecipeUploadForm
                recipeData={JSON.parse(JSON.stringify(recipeData))}
            />
        </div>
    );
};

export default EditRecipePage;
