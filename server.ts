import app from "./app";
import "dotenv/config";
import { connectToDatabase } from "./utils/mongoDB";

// Gracefully handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(`Error Name: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    process.exit(1); // Exit the process to avoid undefined behavior
});

// Function to validate required environment variables
const validateEnvironmentVariables = (): void => {
    const requiredVariables = ["DATABASE", "PORT"];
    requiredVariables.forEach((variable) => {
        if (!process.env[variable]) {
            console.error(`Missing required environment variable: ${variable}`);
            process.exit(1); // Exit if any required variable is missing
        }
    });
};

// Log the current environment
console.log(`Environment: ${app.get("env")}`);

// Validate environment variables
validateEnvironmentVariables();

// Connect to the database
connectToDatabase();

// Start the server
const port = process.env.PORT || 8081;
const server = app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

// Gracefully handle unhandled promise rejections
process.on("unhandledRejection", (error: Error) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(`Error Name: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    server.close(() => {
        process.exit(1); // Exit the process after closing the server
    });
});