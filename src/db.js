import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const connectDB = async () => {
    try {
        await client.connect();
        console.log("MongoDB connected successfully");
        const db = client.db(process.env.DB_NAME);
        return {
            todosCollection: db.collection("todos")
        }
    } catch (error) {
        console.log("Error:", error);
    }
}
export {
    connectDB
}