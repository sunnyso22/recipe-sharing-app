"use server";

import { currentUser } from "@clerk/nextjs/server";
import { addRecipe } from "./recipes";
import { Errors, FormState, Ingredient, Instruction, Seasoning } from "@/types";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";

export const writeRecipe = async (
    image: string | null,
    prevState: FormState,
    formData: FormData
) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    console.log(image);

    const errors: Errors = {};
    if (!image) {
        errors.image = "Image is required!";
    }
    if (!title) {
        errors.title = "Title is required!";
    }
    if (!description) {
        errors.description = "Description is required!";
    }
    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    const user = await currentUser();
    const authorName = user?.fullName as string | null;
    const authorImage = user?.imageUrl as string | null;

    const ingredients: Ingredient[] = [];
    for (let i = 0; i < 3; i++) {
        const name = formData.get(`ingredient-${i}`) as string;
        const quantity = formData.get(`ingredient-qty-${i}`) as string;
        const ingredient = { name, quantity };
        ingredients.push(ingredient);
    }
    const seasonings: Seasoning[] = [];
    for (let i = 0; i < 3; i++) {
        const name = formData.get(`seasoning-${i}`) as string;
        const quantity = formData.get(`seasoning-qty-${i}`) as string;
        const seasoning = { name, quantity };
        seasonings.push(seasoning);
    }
    const instructions: Instruction[] = [];
    for (let i = 0; i < 3; i++) {
        const step = formData.get(`step-${i}`) as string;
        const description = formData.get(`description-${i}`) as string;
        const instruction = { step, description };
        instructions.push(instruction);
    }

    await addRecipe({
        _id: new ObjectId(),
        title,
        description,
        image,
        author: {
            name: authorName,
            image: authorImage,
        },
        likes: 0,
        ingredients,
        seasonings,
        instructions,
    });
    redirect("/recipes");
};
