"use client";

import { useActionState, useState } from "react";
import Form from "next/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRecipe, updateRecipe } from "@/actions/action";
import { Button } from "../ui/button";
import { FormErrors, FormState, Recipe } from "@/types";
import Link from "next/link";
import IngredientsUpload from "./IngredientsUpload";
import SeasoningsUpload from "./SeasoningsUpload";
import InstructionsUpload from "./InstructionsUpload";
import ImageUpload from "./ImageUpload";

const RecipeUploadForm = ({
    recipeData,
    id,
    mode,
}: {
    recipeData: Recipe;
    id: string;
    mode: string;
}) => {
    const initialState: FormState = {
        errors: {},
    };

    const [recipe, setRecipe] = useState<Recipe>(recipeData);
    const handleRecipeChange = (data: Recipe) => {
        setRecipe(data);
    };

    const updateRecipeWithData = updateRecipe.bind(null, id, recipe);
    const createRecipeWithData = createRecipe.bind(null, recipe);

    let actionFunction: (
        prevState: FormState,
        formData: FormData
    ) => Promise<{ errors: FormErrors }> = async () => ({ errors: {} });

    if (mode === "create") {
        actionFunction = createRecipeWithData;
    } else if (mode === "update") {
        actionFunction = updateRecipeWithData;
    }

    const [state, formAction, isPending] = useActionState(
        actionFunction,
        initialState
    );

    return (
        <Form action={formAction}>
            <div className="flex justify-evenly gap-6">
                <ImageUpload
                    onImageChange={handleRecipeChange}
                    recipe={recipe}
                    backendError={state.errors.image}
                />
                <div className="w-1/2 flex flex-col">
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
            <div className="flex justify-evenly gap-6">
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
            <div className="flex gap-3 py-6 justify-end">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="disabled:bg-gray-700"
                >
                    {isPending ? "Saving..." : "Save"}
                </Button>
                <Link href={`/recipes/${id}`}>
                    <Button variant="destructive">Cancel</Button>
                </Link>
            </div>
        </Form>
    );
};

export default RecipeUploadForm;
