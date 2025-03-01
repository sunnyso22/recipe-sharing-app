import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
    throw new Error("URI not defined");
}

if (!MONGODB_DB) {
    throw new Error("DB not defined");
}

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

const connectToDatabase = async () => {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    try {
        cachedClient = new MongoClient(MONGODB_URI);
        await cachedClient.connect();
        cachedDb = cachedClient.db(MONGODB_DB);
        return { client: cachedClient, db: cachedDb };
    } catch (e) {
        console.error("Error connecting to MongoDB:", e);
        if (e instanceof Error) {
            // Narrow down the type to Error to access .message
            throw new Error(`Failed to connect to MongoDB: ${e.message}`);
        } else {
            throw new Error("Failed to connect to MongoDB: Unknown error");
        }
    }
};

export default connectToDatabase;
