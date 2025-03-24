"use server";

import { ObjectId } from "mongodb";
import { downloadImageFromGridFS } from "./image";
import connectToDatabase from "@/lib/db";
import { handleError } from "@/lib/utils";
import { Recipe } from "@/types";

const collection = "recipes";

export const getAllRecipes = async (search?: string) => {
    try {
        let filter = {};
        if (search) filter = { title: { $regex: search, $options: "i" } };

        const { db } = await connectToDatabase();
        const data = await db
            .collection<Recipe>(collection)
            .find(filter)
            .sort({ title: 1 })
            .toArray();

        const plainRecipes: Recipe[] = JSON.parse(JSON.stringify(data));

        const recipesWithImage = await Promise.all(
            plainRecipes.map(async (recipe) => {
                if (recipe.image) {
                    recipe.image = await downloadImageFromGridFS(recipe.image);
                }
                return recipe;
            })
        );

        return recipesWithImage;
    } catch (error) {
        handleError(error);
    }
};

export const getHotRecipes = async (likes: number) => {
    try {
        const { db } = await connectToDatabase();
        const data = await db
            .collection<Recipe>(collection)
            .find({ likes: { $gte: likes } })
            .sort({ title: 1 })
            .toArray();

        const plainRecipes: Recipe[] = JSON.parse(JSON.stringify(data));

        const recipesWithImage = await Promise.all(
            plainRecipes.map(async (recipe) => {
                if (recipe.image) {
                    recipe.image = await downloadImageFromGridFS(recipe.image);
                }
                return recipe;
            })
        );

        return recipesWithImage;
    } catch (error) {
        handleError(error);
    }
};

export const getUserRecipes = async (name: string) => {
    try {
        const { db } = await connectToDatabase();
        const data = await db
            .collection<Recipe>(collection)
            .find({ "author.name": name })
            .toArray();

        const plainRecipes: Recipe[] = JSON.parse(JSON.stringify(data));

        const recipesWithImage = await Promise.all(
            plainRecipes.map(async (recipe) => {
                if (recipe.image) {
                    recipe.image = await downloadImageFromGridFS(recipe.image);
                }
                return recipe;
            })
        );

        return recipesWithImage;
    } catch (error) {
        handleError(error);
    }
};

export const getRecipeById = async (id: string) => {
    try {
        const { db } = await connectToDatabase();
        const data = await db
            .collection<Recipe>(collection)
            .findOne({ _id: new ObjectId(id) });

        const plainRecipe: Recipe = JSON.parse(JSON.stringify(data));

        return {
            ...plainRecipe,
            image: plainRecipe.image
                ? await downloadImageFromGridFS(plainRecipe.image)
                : null,
        };
    } catch (error) {
        handleError(error);
    }
};

export const postRecipe = async (recipe: Recipe) => {
    try {
        const { db } = await connectToDatabase();
        const result = await db
            .collection<Recipe>(collection)
            .insertOne(recipe);

        return result.insertedId;
    } catch (error) {
        handleError(error);
    }
};

export const putRecipe = async (recipe: Recipe) => {
    try {
        const { db } = await connectToDatabase();
        const result = await db.collection<Recipe>(collection).updateOne(
            { _id: new ObjectId(recipe._id.toString()) },
            {
                $set: {
                    title: recipe.title,
                    description: recipe.description,
                    image: recipe.image,
                    likes: recipe.likes,
                    ingredients: recipe.ingredients,
                    seasonings: recipe.seasonings,
                    instructions: recipe.instructions,
                },
            }
        );
        return result;
    } catch (error) {
        handleError(error);
    }
};

export const deleteRecipe = async (id: string) => {
    try {
        const { db } = await connectToDatabase();
        const result = await db
            .collection<Recipe>(collection)
            .deleteOne({ _id: new ObjectId(id) });

        return result;
    } catch (error) {
        handleError(error);
    }
};
