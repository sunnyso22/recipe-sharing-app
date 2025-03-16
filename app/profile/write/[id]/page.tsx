import { getRecipeById } from "@/actions/recipes";
import RecipeUploadForm from "@/components/uploadRecipe/RecipeUploadForm";

const EditRecipePage = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;
    const recipeData = await getRecipeById(id);

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
