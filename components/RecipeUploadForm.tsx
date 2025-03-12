"use client";

import React, { useActionState, useState } from "react";
import Form from "next/form";
import UploadImage from "@/components/UploadImage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { writeRecipe } from "@/app/actions/action";
import { Button } from "./ui/button";
import { FormState, Ingredient, Instruction, Seasoning } from "@/types";
import Link from "next/link";
import IngredientsUpload from "./IngredientsUpload";
import SeasoningsUpload from "./SeasoningsUpload";
import InstructionsUpload from "./InstructionsUpload";

const RecipeUploadForm = () => {
    const initialState: FormState = {
        errors: {},
    };

    const [image, setImage] = useState<string | null>(null);
    const handleImageChange = (imageData: string | null) => {
        setImage(imageData);
    };
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const handleIngredientsChange = (ingredientsData: Ingredient[]) => {
        setIngredients(ingredientsData);
    };
    const [seasonings, setSeasonings] = useState<Seasoning[]>([]);
    const handleSeasoningsChange = (seasoningsData: Seasoning[]) => {
        setSeasonings(seasoningsData);
    };
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const handleInstructionsChange = (instructionsData: Instruction[]) => {
        setInstructions(instructionsData);
    };

    const writeRecipeWithData = writeRecipe.bind(
        null,
        image,
        ingredients,
        seasonings,
        instructions
    );

    const [state, formAction, isPending] = useActionState(
        writeRecipeWithData,
        initialState
    );

    return (
        <Form action={formAction}>
            <div className="flex justify-evenly gap-6">
                <UploadImage
                    onImageChange={handleImageChange}
                    error={state.errors.image}
                />
                <div className="w-1/2 flex flex-col">
                    <>
                        <Input
                            name="title"
                            type="text"
                            placeholder="Recipe Title"
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
                    onIngredientsChange={handleIngredientsChange}
                />
                <SeasoningsUpload onSeasoningsChange={handleSeasoningsChange} />
            </div>
            <InstructionsUpload
                onInstructionsChange={handleInstructionsChange}
            />
            <div className="flex gap-3 py-6 justify-end">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="disabled:bg-gray-700"
                >
                    {isPending ? "Saving..." : "Save"}
                </Button>
                <Link href="/profile">
                    <Button variant="destructive">Cancel</Button>
                </Link>
            </div>
        </Form>
    );
};

export default RecipeUploadForm;
