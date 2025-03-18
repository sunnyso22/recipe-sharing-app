"use server";

import connectToDatabase from "@/lib/db";
import { handleError } from "@/lib/utils";
import { Recipe } from "@/types";
import { ObjectId } from "mongodb";

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

        if (data) return data;
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

        if (data) return data;
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

        if (data) return data;
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

        if (data) return data;
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

export const putRecipe = async (id: string, recipe: Recipe) => {
    try {
        const { db } = await connectToDatabase();
        const result = await db.collection<Recipe>(collection).updateOne(
            { _id: new ObjectId(id) },
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
