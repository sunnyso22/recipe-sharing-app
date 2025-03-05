import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import UploadImage from "@/components/UploadImage";
import Form from "next/form";
import React from "react";

const WriteRecipePage = () => {
    return (
        <div className="container mx-auto mt-12">
            <Form action="">
                <div className="w-full flex justify-evenly gap-6">
                    <UploadImage />
                    <div className="w-1/2 flex flex-col gap-6">
                        <Input
                            id="title"
                            type="text"
                            placeholder="Recipe Title"
                        />
                        <Textarea
                            id="description"
                            placeholder="Describe your recipe..."
                        />
                    </div>
                </div>
                <div className="w-full flex justify-evenly gap-6">
                    <div className="w-1/2">
                        <h3 className="text-2xl font-semibold py-6">
                            Ingredients
                        </h3>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-3 py-3">
                                <Input
                                    className="w-full"
                                    id={`ingredient-${i}`}
                                    type="text"
                                    placeholder={`Ingredient ${i + 1}`}
                                />
                                <Input
                                    className="w-full"
                                    type="text"
                                    placeholder="Quantity"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="w-1/2">
                        <h3 className="text-2xl font-semibold py-6">
                            Seasonings
                        </h3>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-3 py-3">
                                <Input
                                    className="w-full"
                                    id={`seasoning-${i}`}
                                    type="text"
                                    placeholder={`Seasoning ${i + 1}`}
                                />
                                <Input
                                    className="w-full"
                                    type="text"
                                    placeholder="Quantity"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full">
                    <h3 className="text-2xl font-semibold py-6">
                        Instructions
                    </h3>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3 py-3 items-center">
                            <span className="flex justify-center items-center text-xl text-white bg-paragraph rounded-full h-8 w-8">
                                {i + 1}
                            </span>
                            <Input
                                className="w-full"
                                id={`instruction-${i}`}
                                type="text"
                                placeholder={`Instruction ${i + 1}`}
                            />
                        </div>
                    ))}
                </div>
            </Form>
        </div>
    );
};

export default WriteRecipePage;
