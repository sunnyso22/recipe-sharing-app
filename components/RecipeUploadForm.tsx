"use client";

import React, { useActionState, useState } from "react";
import Form from "next/form";
import UploadImage from "@/components/UploadImage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { writeRecipe } from "@/app/actions/action";
import { Button } from "./ui/button";
import { FormState } from "@/types";
import Link from "next/link";

const RecipeUploadForm = () => {
    const initialState: FormState = {
        errors: {},
    };

    const [image, setImage] = useState<string | null>(null);
    const handleImageChange = (imageData: string | null) => {
        setImage(imageData);
    };

    const writeRecipeWithImage = writeRecipe.bind(null, image);

    const [state, formAction, isPending] = useActionState(
        writeRecipeWithImage,
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
                <div className="w-full">
                    <h3 className="text-2xl font-semibold py-6">Ingredients</h3>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3 py-3">
                            <Input
                                name={`ingredient-${i}`}
                                className="w-full"
                                type="text"
                                placeholder={`Ingredient ${i + 1}`}
                            />
                            <Input
                                name={`ingredient-qty-${i}`}
                                className="w-full"
                                type="text"
                                placeholder="Quantity"
                            />
                        </div>
                    ))}
                </div>
                <div className="w-full">
                    <h3 className="text-2xl font-semibold py-6">Seasonings</h3>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3 py-3">
                            <Input
                                name={`seasoning-${i}`}
                                className="w-full"
                                type="text"
                                placeholder={`Seasoning ${i + 1}`}
                            />
                            <Input
                                name={`seasoning-qty-${i}`}
                                className="w-full"
                                type="text"
                                placeholder="Quantity"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full">
                <h3 className="text-2xl font-semibold py-6">Instructions</h3>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 py-3 items-center">
                        <span className="flex justify-center items-center text-xl text-white bg-paragraph rounded-full h-8 w-8">
                            {i + 1}
                        </span>
                        <Input name={`step-${i}`} defaultValue={i + 1} hidden />
                        <Input
                            name={`description-${i}`}
                            className="w-full"
                            type="text"
                            placeholder={`Instruction ${i + 1}`}
                        />
                    </div>
                ))}
            </div>
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
