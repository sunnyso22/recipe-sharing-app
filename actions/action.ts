"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { deleteRecipe, postRecipe, putRecipe } from "./recipes";
import { handleError } from "@/lib/utils";
import { FormErrors, FormState, Metadata, Recipe } from "@/types";

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
    recipe: Recipe,
    prevState: FormState,
    formData: FormData
) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const { _id, image } = recipe;

    const errors: FormErrors = {};

    if (!image) {
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

    const result = await putRecipe({ ...recipe, title, description });
    redirect(`/recipes/${_id.toString()}`);
};

export const removeRecipe = async (id: string) => {
    const result = await deleteRecipe(id);
    if (result) redirect("/cookbook");
};

export const addLike = async (recipe: Recipe) => {
    const result = await putRecipe({ ...recipe, likes: recipe.likes + 1 });
    if (result) revalidatePath(`/recipes/${recipe._id.toString()}`);
};

export const removeLike = async (recipe: Recipe) => {
    const result = await putRecipe({ ...recipe, likes: recipe.likes - 1 });
    if (result) revalidatePath(`/recipes/${recipe._id.toString()}`);
};

export const updateToClerkPublicMetaData = async (lists: Metadata = {}) => {
    const { favList, bmList } = lists;

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

        if (res) revalidatePath("/");
    } catch (error) {
        handleError(error);
    }
};
