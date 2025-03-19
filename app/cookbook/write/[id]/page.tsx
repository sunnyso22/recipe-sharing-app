import { getAllRecipes, getRecipeById } from "@/actions/recipes";
import RecipeUploadForm from "@/components/uploadRecipe/RecipeUploadForm";
import { Recipe } from "@/types";
import { ObjectId } from "mongodb";

export const generateStaticParams = async () => {
    const recipeData: Recipe[] = (await getAllRecipes()) || [];
    return recipeData.map((recipe) => ({
        id: recipe._id.toString(),
    }));
};

const EditRecipePage = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;
    const recipeData: Recipe = (await getRecipeById(id)) || {
        _id: new ObjectId(),
        author: { name: "", image: "" },
        likes: 0,
        image: "",
        title: "",
        description: "",
        ingredients: [],
        seasonings: [],
        instructions: [],
    };

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
                id={id}
                mode={"update"}
            />
        </div>
    );
};

export default EditRecipePage;
