"use client";

import { useActionState, useState } from "react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRecipe, updateRecipe } from "@/actions/action";
import { Button } from "../ui/button";
import IngredientsUpload from "./IngredientsUpload";
import SeasoningsUpload from "./SeasoningsUpload";
import InstructionsUpload from "./InstructionsUpload";
import ImageUpload from "./ImageUpload";
import { FormState, Recipe } from "@/types";

const RecipeUploadForm = ({ recipeData }: { recipeData: Recipe }) => {
    const initialState: FormState = {
        errors: {},
    };

    const router = useRouter();

    const [recipe, setRecipe] = useState<Recipe>(recipeData);
    const handleRecipeChange = (data: Recipe) => {
        setRecipe(data);
    };

    const [state, formAction, isPending] = useActionState(
        recipe._id
            ? updateRecipe.bind(null, recipe)
            : createRecipe.bind(null, recipe),
        initialState
    );

    return (
        <Form action={formAction} className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row justify-evenly gap-6">
                <ImageUpload
                    recipe={recipe}
                    backendError={state.errors.image}
                />
                <div className="w-full lg:w-1/2 flex flex-col">
                    <>
                        <Input
                            name="title"
                            type="text"
                            placeholder="Recipe Title"
                            defaultValue={recipeData.title}
                        />
                        {state.errors.title ? (
                            <p className="text-sm text-red-500">
                                {state.errors.title}
                            </p>
                        ) : (
                            <p>&nbsp;</p>
                        )}
                    </>
                    <>
                        <Textarea
                            name="description"
                            placeholder="Describe your recipe..."
                            defaultValue={recipeData.description}
                        />
                        {state.errors.description && (
                            <p className="text-sm text-red-500">
                                {state.errors.description}
                            </p>
                        )}
                    </>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row justify-evenly gap-6">
                <IngredientsUpload
                    onIngredientsChange={handleRecipeChange}
                    recipe={recipe}
                />
                <SeasoningsUpload
                    onSeasoningsChange={handleRecipeChange}
                    recipe={recipe}
                />
            </div>
            <InstructionsUpload
                onInstructionsChange={handleRecipeChange}
                recipe={recipe}
            />
            <div className="flex gap-3 justify-center lg:justify-end">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="disabled:bg-gray-700"
                >
                    {isPending ? "Saving..." : "Save"}
                </Button>
                <Button variant="destructive" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </Form>
    );
};

export default RecipeUploadForm;
