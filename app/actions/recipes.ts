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
        return false;
    } catch (error) {
        handleError(error);
    }
};

export const getHotRecipes = async () => {
    try {
        const { db } = await connectToDatabase();
        const data = await db
            .collection<Recipe>(collection)
            .find({ likes: { $gte: 5 } })
            .sort({ title: 1 })
            .toArray();

        if (data) return data;
        return false;
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
        return false;
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
        return false;
    } catch (error) {
        handleError(error);
    }
};
