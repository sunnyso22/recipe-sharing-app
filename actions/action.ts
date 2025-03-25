"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import {
    checkNeedToUpload,
    removeImageFromGridFS,
    uploadImageToGridFS,
} from "./image";
import { deleteRecipe, getRecipeById, postRecipe, putRecipe } from "./recipes";
import { handleError } from "@/lib/utils";
import { FormErrors, FormState, Metadata, Recipe } from "@/types";

export const createRecipe = async (
    recipe: Recipe,
    prevState: FormState,
    formData: FormData
) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const imageFile = formData.get("imageFile") as File;

    const errors: FormErrors = {};
    if (!imageFile || imageFile.size === 0) {
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

    const imageId = await uploadImageToGridFS(imageFile);

    const user = await currentUser();
    if (!user) throw new Error("No user is logged in to create recipe!");
    const aName = user.fullName as string;
    const aImage = user.imageUrl as string;

    const { ingredients, seasonings, instructions } = recipe;

    const id = await postRecipe({
        title,
        description,
        imageId,
        author: { aName, aImage },
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
    if (!recipe._id) {
        throw new Error("Recipe ID is undefined!");
    }
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const imageFile = formData.get("imageFile") as File;
    console.log(imageFile);
    const imageAction = formData.get("imageAction") as string;
    console.log(imageAction);

    const errors: FormErrors = {};
    if (!title) {
        errors.title = "Title is required!";
    }
    if (!description) {
        errors.description = "Description is required!";
    }

    let imageId = "";
    let needToUpload = false;

    switch (imageAction) {
        case "keep":
            // Case 1: User only edits other fields, keep existing image
            imageId = recipe.imageId;
            break;

        case "replace":
            // Case 2: User uploads new image
            if (imageFile && imageFile.size > 0) {
                // New image is uploaded
                needToUpload = await checkNeedToUpload(
                    recipe.imageId,
                    imageFile
                );
                if (needToUpload) {
                    await removeImageFromGridFS(recipe.imageId);
                    imageId = await uploadImageToGridFS(imageFile);
                }
            }
            break;

        case "remove":
            // Case 3: User removes image
            if (!imageFile || imageFile.size === 0) {
                errors.image = "Image file is required!";
            }
            break;
    }
    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    const result = await putRecipe({
        ...recipe,
        title,
        description,
        imageId,
    });

    redirect(`/recipes/${recipe._id.toString()}`);
};

export const removeRecipe = async (id: string) => {
    const recipe = await getRecipeById(id);
    if (recipe && recipe.imageId) {
        await removeImageFromGridFS(recipe.imageId);
    }
    const result = await deleteRecipe(id);
    if (result) redirect("/cookbook");
};

export const addLike = async (recipe: Recipe) => {
    if (!recipe._id) {
        throw new Error("Recipe ID is undefined!");
    }
    const result = await putRecipe({ ...recipe, likes: recipe.likes + 1 });
    if (result) revalidatePath(`/recipes/${recipe._id.toString()}`);
};

export const removeLike = async (recipe: Recipe) => {
    if (!recipe._id) {
        throw new Error("Recipe ID is undefined!");
    }
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
