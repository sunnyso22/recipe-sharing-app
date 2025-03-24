import { ObjectId } from "mongodb";
import RecipeUploadForm from "@/components/uploadRecipe/RecipeUploadForm";
import { Recipe } from "@/types";

const CreateRecipePage = () => {
    const recipeData: Recipe = {
        _id: new ObjectId(),
        author: { name: "", image: "" },
        likes: 0,
        image: "",
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
            <RecipeUploadForm
                recipeData={JSON.parse(JSON.stringify(recipeData))}
                mode={"create"}
            />
        </div>
    );
};

export default CreateRecipePage;
