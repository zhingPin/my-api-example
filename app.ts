import "dotenv/config";
import hpp from "hpp";
import express, { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import mediaRouter from "./media/mediaRouter";
import userRouter from "./users/router/userRouter";
import path from "path";
import { fileURLToPath } from "url";
import AppError from "./utils/appError";
import globalErrorHandler from "./utils/globalErrorHandler";
import xss from "xss-clean";


// Get the current file's directory path
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();

// ✅ FIX: Trust proxy (for rate limiting to work properly on Vercel)
app.set("trust proxy", 1);

// // ✅ Allow frontend origin
// app.use(cors());
// app.options("*", cors(
//   { credentials: true, }// ✅ allow cookies / auth headers

// ));

const allowedOrigins = [
    // prod
    'https://express-test-front.vercel.app', // your frontend
    'https://myfrenneo.vercel.app',
    // dev
    'http://localhost:3000',
    'http://localhost:3001',
];

app.use(cors({
    origin: (origin, callback) => {
        // allow Postman/curl with no Origin header
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // <— needed for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// handle preflight
app.options('*', cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(mongoSanitize()); // Prevent NoSQL injection attacks
app.use(xss());
app.post(
    "/submit",
    [body("input").trim().escape()], // Use an array for middleware
    (req: Request, res: Response): void => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return; // Ensure function execution stops here
        }
        res.send("Data is clean");
    }
);

app.use(
    hpp({
        whitelist: [
            "duration",
            "rating",
            "price"
        ],
    })
);
// Body parser: Limit request payload size
app.use(express.json({ limit: "1000kb" }));
app.use(express.urlencoded({ extended: true })); // Helps with URL-encoded form data

app.use(helmet()); // Secure HTTP headers



// Static file serving
app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev")); // Logging middleware
    console.log("Hey i am the development function 👋");
    // Custom middleware: Example usage
    app.use(
        (
            req: Request & { requestTime?: string },
            res: Response,
            next: NextFunction
        ) => {
            req.requestTime = new Date().toISOString();
            console.log("Request received at:", req.requestTime);
            // console.log("req.url:", `${req.protocol}://${req.get("host")}${req.originalUrl}`); // frontend making the request
            // console.log("Request method:", req.method);
            // console.log("req.rawHeaders", req.rawHeaders)
            // console.log("Request IP address:", req.ip);
            next();
        }
    );
}



app.get("/docs", (req: Request, res: Response) => {
    res.send("Documentation.");
});

// Rate limiting
const apiLimiter = rateLimit({
    max: 150, // Limit each IP to 150 requests per hour
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour.",
});
app.use("/api", apiLimiter);

// Mount routers
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/user", userRouter);



// Catch-all handler for undefined routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(globalErrorHandler);
// app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
//   globalErrorHandler(err, req, res, next);
// });



// Export the app
export default app;
