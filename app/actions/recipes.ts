"use server";

import connectToDatabase from "@/lib/db";
import { handleError } from "@/lib/utils";

const collection = "recipes";

export const getAllRecipes = async () => {
    try {
        const { db } = await connectToDatabase();
        const data = await db
            .collection(collection)
            .find({}, { projection: { _id: 0 } })
            .toArray();

        if (data) return data;
        return false;
    } catch (error) {
        handleError(error);
    }
};
