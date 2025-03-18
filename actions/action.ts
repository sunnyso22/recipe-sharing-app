"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { deleteRecipe, postRecipe, putRecipe } from "./recipes";
import { FormErrors, FormState, Recipe } from "@/types";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { handleError } from "@/lib/utils";

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
    if (!user) throw new Error("No user is logged in to create recipe!");
    const authorName = user.fullName as string;
    const authorImage = user.imageUrl as string;

    const id = await postRecipe({
        ...recipe,
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
    const { image, ingredients, seasonings, instructions } = recipe;

    const errors: FormErrors = {};

    if (!recipe.image) {
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

    const result = await putRecipe(id, {
        ...recipe,
        title,
        description,
        image,
        ingredients,
        seasonings,
        instructions,
    });
    redirect(`/recipes/${id}`);
};

export const removeRecipe = async (id: string) => {
    const result = await deleteRecipe(id);
    redirect("/cookbook");
};

export const addLike = async (id: string, recipe: Recipe, likes: number) => {
    const result = await putRecipe(id, { ...recipe, likes: likes + 1 });
    revalidatePath(`/recipes/${id}`);
};

export const removeLike = async (id: string, recipe: Recipe, likes: number) => {
    const result = await putRecipe(id, { ...recipe, likes: likes - 1 });
    revalidatePath(`/recipes/${id}`);
};

export const updateToClerkPublicMetaData = async (
    favList?: string[],
    bmList?: string[]
) => {
    try {
        const user = await currentUser();
        if (!user) return false;

        const client = await clerkClient();

        const res = await client.users.updateUserMetadata(user.id, {
            publicMetadata: {
                favourites: favList,
                bookmarks: bmList,
            },
        });

        if (res) return true;
        throw new Error("Cannot update Clerk metadata");
    } catch (error) {
        handleError(error);
    }
};
