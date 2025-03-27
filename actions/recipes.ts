"use server";

import { ObjectId } from "mongodb";
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

        return data;
    } catch (error) {
        throw handleError(error);
    }
};

export const getHotRecipes = async (likes: number) => {
    try {
        const { db } = await connectToDatabase();
        const data = await db
            .collection<Recipe>(collection)
            .find({ likes: { $gte: likes } })
            .sort({ likes: -1 })
            .toArray();

        return data;
    } catch (error) {
        throw handleError(error);
    }
};

export const getUserRecipes = async (name: string) => {
    try {
        const { db } = await connectToDatabase();
        const data = await db
            .collection<Recipe>(collection)
            .find({ "author.aName": name })
            .toArray();

        return data;
    } catch (error) {
        throw handleError(error);
    }
};

export const getRecipeById = async (id: string) => {
    try {
        const { db } = await connectToDatabase();
        const data = await db
            .collection<Recipe>(collection)
            .findOne({ _id: new ObjectId(id) });

        return data;
    } catch (error) {
        throw handleError(error);
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
        throw handleError(error);
    }
};

export const putRecipe = async (recipe: Recipe) => {
    try {
        const { db } = await connectToDatabase();
        const {
            _id,
            title,
            description,
            imageId,
            likes,
            ingredients,
            seasonings,
            instructions,
        } = recipe;
        const result = await db.collection<Recipe>(collection).updateOne(
            { _id: new ObjectId(_id?.toString()) },
            {
                $set: {
                    title,
                    description,
                    imageId,
                    likes,
                    ingredients,
                    seasonings,
                    instructions,
                },
            }
        );
        return result;
    } catch (error) {
        throw handleError(error);
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
        throw handleError(error);
    }
};
