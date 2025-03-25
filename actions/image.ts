"use server";

import { Readable } from "stream";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";
import connectToGridFS from "@/lib/gridfs";

export const uploadImageToGridFS = async (imageFile: File): Promise<string> => {
    try {
        const { bucket } = await connectToGridFS();

        // Convert file to buffer
        const buffer = Buffer.from(await imageFile.arrayBuffer());

        // Create a readable stream from the buffer
        const stream = Readable.from(buffer);

        // Create a unique filename
        const filename = `${Date.now()}-${imageFile.name}`;

        // Generate a hash of the image to check for duplicates
        const imageHash = createHash("md5").update(buffer).digest("hex");

        // Upload to GridFS
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: imageFile.type,
            metadata: {
                originalName: imageFile.name,
                md5: imageHash,
            },
        });

        // Return a promise that resolves with the file ID when the upload is complete
        return new Promise((resolve, reject) => {
            stream
                .pipe(uploadStream)
                .on("error", (error) => reject(error))
                .on("finish", () => resolve(uploadStream.id.toString()));
        });
    } catch (error) {
        console.error("Error uploading to GridFS:", error);
        throw new Error("Error uploading to GridFS");
    }
};

export const removeImageFromGridFS = async (imageId: string) => {
    const { bucket } = await connectToGridFS();
    await bucket
        .delete(new ObjectId(imageId))
        .catch((err) => console.error("Error deleting image:", err));
};

export const getRecipeImageFileById = async (imageId: string) => {
    const { db } = await connectToGridFS();
    const data = await db
        .collection("images.files")
        .findOne({ _id: new ObjectId(imageId) });

    return JSON.parse(JSON.stringify(data));
};

export const checkNeedToUpload = async (
    currentImageId: string,
    newImageFile: File
) => {
    const currentImageFile = await getRecipeImageFileById(currentImageId);

    // Convert file to buffer
    const buffer = Buffer.from(await newImageFile.arrayBuffer());

    // Generate a hash of the image to check for duplicates
    const newImageHash = createHash("md5").update(buffer).digest("hex");

    if (currentImageFile && currentImageFile.metadata.md5 === newImageHash) {
        return false;
    }

    return true;
};
