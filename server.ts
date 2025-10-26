import app from "./app";
import "dotenv/config";
import { connectToDatabase } from "./utils/mongoDB";

process.on("uncaughtException", (error: Error) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(`Error Name: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    process.exit(1);
});

const validateEnvironmentVariables = (): void => {
    const requiredVariables = ["DATABASE", "PORT"];
    requiredVariables.forEach((variable) => {
        if (!process.env[variable]) {
            console.error(`Missing required environment variable: ${variable}`);
            process.exit(1);
        }
    });
};

console.log(`Environment: ${app.get("env")}`);
validateEnvironmentVariables();

const startServer = async () => {
    try {
        await connectToDatabase(); // ✅ wait for DB to connect first
        console.log("✅ Database connected");

        const port = process.env.PORT || 8081;
        const server = app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });

        process.on("unhandledRejection", (error: Error) => {
            console.error("UNHANDLED REJECTION! 💥 Shutting down...");
            console.error(`Error Name: ${error.name}`);
            console.error(`Error Message: ${error.message}`);
            server.close(() => process.exit(1));
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
