"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Load environment variables from .env file
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Ensure MONGO_URI is defined
if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in the environment variables");
}
// connect to MongoDB
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        mongoose_1.default.connect(process.env.MONGO_URI, {
            autoIndex: true, // Enable auto-indexing
        });
        console.log("MongoDB connected successfully");
        mongoose_1.default.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        });
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error; // Re-throw the error to handle it in the calling function
    }
});
exports.connectDB = connectDB;
// disconnect from MongoDB
const disconnectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.disconnect();
        console.log("MongoDB disconnected successfully");
    }
    catch (error) {
        console.error("Error disconnecting from MongoDB:", error);
    }
});
exports.disconnectDB = disconnectDB;
