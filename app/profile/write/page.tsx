import RecipeUploadForm from "@/components/RecipeUploadForm";

const WriteRecipePage = () => {
    return (
        <div className="container mx-auto">
            <div className="py-6">
                <h2 className="text-2xl font-bold">Upload Recipe</h2>
                <p className="text-paragraph text-lg">
                    You can upload your recipe here.
                </p>
            </div>
            <RecipeUploadForm />
        </div>
    );
};

export default WriteRecipePage;
