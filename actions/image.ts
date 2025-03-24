"use server";

import { Readable } from "stream";
import { ObjectId } from "mongodb";
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

        // Upload to GridFS
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: imageFile.type,
            metadata: {
                originalName: imageFile.name,
                uploadDate: new Date(),
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

export const downloadImageFromGridFS = async (
    imageId: string
): Promise<string | null> => {
    try {
        if (!imageId) {
            return null;
        }

        const { db, bucket } = await connectToGridFS();
        const file = await db
            .collection("images.files")
            .findOne({ _id: new ObjectId(imageId) });
        if (!file) {
            return null;
        }

        // Create a download stream
        const downloadStream = bucket.openDownloadStream(new ObjectId(imageId));

        // Collect the file data
        const chunks: Buffer[] = [];

        return new Promise<string>((resolve, reject) => {
            downloadStream.on("data", (chunk) => {
                chunks.push(Buffer.from(chunk));
            });

            downloadStream.on("error", (err) => {
                console.error("Error downloading from GridFS:", err);
                reject(new Error("Error downloading from GridFS"));
            });

            downloadStream.on("end", () => {
                const buffer = Buffer.concat(chunks);
                const base64 = buffer.toString("base64");
                const contentType = file.contentType || "image/jpeg";

                resolve(`data:${contentType};base64,${base64}`);
            });
        });
    } catch (error) {
        console.error("Error downloading from GridFS:", error);
        throw new Error("Error downloading from GridFS");
    }
};
