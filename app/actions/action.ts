"use server";

import { currentUser } from "@clerk/nextjs/server";
import { addRecipe } from "./recipes";
import { Ingredient, Instruction, Seasoning } from "@/types";
import { ObjectId } from "mongodb";

export const writeRecipe = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;

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

    addRecipe({
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
};
