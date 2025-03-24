import connectToGridFS from "@/lib/gridfs";
import { ObjectId } from "mongodb";

export const GET = async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params;

        if (!id) {
            return new Response("Invalid image ID", { status: 400 });
        }

        const { db, bucket } = await connectToGridFS();
        const file = await db
            .collection("images.files")
            .findOne({ _id: new ObjectId(id) });

        if (!file) {
            return new Response("Image not found", { status: 404 });
        }

        // Create a download stream
        const downloadStream = bucket.openDownloadStream(new ObjectId(id));

        // Collect the file data
        const chunks: Buffer[] = [];

        return new Promise<Response>((resolve) => {
            downloadStream.on("data", (chunk) => {
                chunks.push(Buffer.from(chunk));
            });

            downloadStream.on("error", (err) => {
                console.error("Error downloading from GridFS:", err);
                resolve(
                    new Response("Error downloading from GridFS", {
                        status: 500,
                    })
                );
            });

            downloadStream.on("end", () => {
                const buffer = Buffer.concat(chunks);
                resolve(
                    new Response(buffer, {
                        headers: {
                            "Content-Type":
                                file.contentType || "application/octet-stream",
                            "Cache-Control":
                                "public, max-age=31536000, immutable",
                        },
                    })
                );
            });
        });
    } catch (error) {
        console.error("Error in image route:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};
