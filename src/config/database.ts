import mongoose from "mongoose";

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();
// Ensure MONGO_URI is defined
if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in the environment variables");
}

// connect to MongoDB
export const connectDB = async () => {
    try {
        mongoose.connect(process.env.MONGO_URI as string, {
            autoIndex: true, // Enable auto-indexing
        });
        console.log("MongoDB connected successfully");
        mongoose.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        })
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error; // Re-throw the error to handle it in the calling function
    }
}

// disconnect from MongoDB
export const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected successfully");
    } catch (error) {
        console.error("Error disconnecting from MongoDB:", error);
    }
}