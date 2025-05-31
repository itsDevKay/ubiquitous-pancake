import dotenv from 'dotenv';
dotenv.config();
// Import database connection
import { connectDB } from './config/database';
// Connect to the database
connectDB().catch(err => {
    console.error("Failed to connect to the database:", err);
    process.exit(1); // Exit the process if the database connection fails
});
// Import user routes
import userRoutes from './routes/UserRoutes';
// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// Initialize the Express application 
const app = express();
const PORT = process.env.PORT || 2000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
export default app;
export { app, PORT };