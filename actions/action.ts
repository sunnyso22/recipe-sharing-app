"use server";

import { currentUser } from "@clerk/nextjs/server";
import { deleteRecipe, postRecipe, putRecipe } from "./recipes";
import { FormErrors, FormState, Recipe } from "@/types";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const createRecipe = async (
    recipe: Recipe,
    prevState: FormState,
    formData: FormData
) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const { image, ingredients, seasonings, instructions } = recipe;

    const errors: FormErrors = {};
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

    const id = await postRecipe({
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

    redirect(`/recipes/${id}`);
};

export const updateRecipe = async (
    id: string,
    recipe: Recipe,
    prevState: FormState,
    formData: FormData
) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    const errors: FormErrors = {};

    if ("image" in recipe && !recipe.image) {
        errors.image = "Image file is required!";
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

    const result = await putRecipe(id, title, description, recipe);
    console.log(result);
    redirect(`/recipes/${id}`);
};

export const removeRecipe = async (id: string) => {
    const result = await deleteRecipe(id);
    console.log(result);
    redirect("/profile");
};
