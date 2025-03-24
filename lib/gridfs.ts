import { MongoClient, GridFSBucket, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
    throw new Error("URI not defined");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let cachedBucket: GridFSBucket | null = null;

const connectToGridFS = async () => {
    if (cachedClient && cachedDb && cachedBucket) {
        return { client: cachedClient, db: cachedDb, bucket: cachedBucket };
    }

    try {
        cachedClient = new MongoClient(MONGODB_URI);
        await cachedClient.connect();
        cachedDb = cachedClient.db(MONGODB_DB);
        cachedBucket = new GridFSBucket(cachedDb, { bucketName: "images" });
        return { client: cachedClient, db: cachedDb, bucket: cachedBucket };
    } catch (e) {
        console.error("Error connecting to GridFS:", e);
        if (e instanceof Error) {
            // Narrow down the type to Error to access .message
            throw new Error(`Failed to connect to MongoDB: ${e.message}`);
        } else {
            throw new Error("Failed to connect to MongoDB: Unknown error");
        }
    }
};

export default connectToGridFS;
