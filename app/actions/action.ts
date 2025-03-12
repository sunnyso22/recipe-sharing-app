"use server";

import { currentUser } from "@clerk/nextjs/server";
import { addRecipe } from "./recipes";
import { Errors, FormState, Ingredient, Instruction, Seasoning } from "@/types";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";

export const writeRecipe = async (
    image: string | null,
    ingredients: Ingredient[],
    seasonings: Seasoning[],
    instructions: Instruction[],
    prevState: FormState,
    formData: FormData
) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

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
    redirect("/profile");
};
