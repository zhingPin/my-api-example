import app from "./app";
import "dotenv/config";
import { connectToDatabase } from "./utils/mongoDB";

process.on("uncaughtException", (err: Error) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", err.name, err.message);
    process.exit(1);
});

// Validate environment variables
const validateEnvVars = () => {
    const requiredVars = ["DATABASE", "PORT"];
    requiredVars.forEach((key) => {
        if (!process.env[key]) {
            console.error(`${key} environment variable is missing`);
            process.exit(1);
        }
    });
};

console.log("environment:", app.get("env"));

validateEnvVars();
connectToDatabase();
const port = process.env.PORT || 8081;
const server = app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});

process.on("unhandledRejection", (err: Error) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...", err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});


