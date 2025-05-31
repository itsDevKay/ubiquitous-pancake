"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Import database connection
const database_1 = require("./config/database");
// Connect to the database
(0, database_1.connectDB)().catch(err => {
    console.error("Failed to connect to the database:", err);
    process.exit(1); // Exit the process if the database connection fails
});
// Import user routes
const UserRoutes_1 = __importDefault(require("./routes/UserRoutes"));
// Import necessary modules
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
// Initialize the Express application 
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 2000;
exports.PORT = PORT;
// Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/users', UserRoutes_1.default);
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Export the app for testing purposes
exports.default = app;
