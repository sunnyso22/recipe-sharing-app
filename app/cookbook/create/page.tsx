import { Metadata } from "next";
import RecipeUploadForm from "@/components/uploadRecipe/RecipeUploadForm";
import { Recipe } from "@/types";

export const metadata: Metadata = {
    title: "Create Recipe",
};

const CreateRecipePage = () => {
    const recipeData: Recipe = {
        author: { aName: null, aImage: null },
        likes: 0,
        imageId: "",
        title: "",
        description: "",
        ingredients: [{ id: 1, name: "", quantity: "" }],
        seasonings: [{ id: 1, name: "", quantity: "" }],
        instructions: [{ step: 1, description: "" }],
    };

    return (
        <div className="container mx-auto">
            <div className="py-6">
                <h2 className="text-2xl font-bold">Upload Recipe</h2>
                <p className="text-paragraph text-lg">
                    You can upload your recipe here.
                </p>
            </div>
            <RecipeUploadForm recipeData={recipeData} />
        </div>
    );
};

export default CreateRecipePage;
