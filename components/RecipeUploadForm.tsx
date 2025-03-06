"use client";

import React, { useState } from "react";
import Form from "next/form";
import UploadImage from "@/components/UploadImage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { writeRecipe } from "@/app/actions/action";
import { Button } from "./ui/button";

const RecipeUploadForm = () => {
    const [image, setImage] = useState<string | null>(null);

    const handleImageChange = (imageData: string | null) => {
        setImage(imageData);
    };

    const handleSubmit = async (formData: FormData) => {
        if (image) {
            formData.append("image", image);
        }
        const result = await writeRecipe(formData);
        console.log(result);
    };

    return (
        <Form action={handleSubmit}>
            <div className="w-full flex justify-evenly gap-6">
                <UploadImage onImageChange={handleImageChange} />
                <div className="w-1/2 flex flex-col gap-6">
                    <Input
                        name="title"
                        type="text"
                        placeholder="Recipe Title"
                    />
                    <Textarea
                        name="description"
                        placeholder="Describe your recipe..."
                    />
                </div>
            </div>
            <div className="w-full flex justify-evenly gap-6">
                <div className="w-1/2">
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
                <div className="w-1/2">
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
            <Button type="submit">Publish</Button>
        </Form>
    );
};

export default RecipeUploadForm;
