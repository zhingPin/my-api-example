
import { IUser, UserModel } from "../models/userShema";
import AppError from "../../utils/appError";
import { catchAsync } from "../../utils/catchAsync";
import { CookieOptions, NextFunction, Request, Response } from "express";
import sendEmail from "../../utils/sendEmail";
import crypto from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

// Custom JWT payload interface
// --- Custom JWT Payload Interface ---
interface JWTPayload extends JwtPayload {
    id: string;
}

// --- Extend Request for typed user ---
interface AuthRequest extends Request {
    user?: IUser;
}

// --- Environment Variables ---
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "90d";

if (!JWT_SECRET || !JWT_EXPIRES_IN) {
    throw new Error("JWT_SECRET and JWT_EXPIRES_IN must be defined in environment variables");
}


// --- Send Token via Cookie ---
const createAndSendToken = (user: IUser, statusCode: number, res: Response) => {
    const expiresIn: SignOptions["expiresIn"] =
        (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "10d";

    const token = jwt.sign({ id: user._id }, JWT_SECRET as jwt.Secret, {
        expiresIn,
    });

    const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE_IN?.replace("d", "") || "90");

    const cookieOptions: CookieOptions = {
        expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true, // ✅ Required for HTTPS
        sameSite: "lax", // ✅ Required for cross-origin
        // domain: process.env.NODE_ENV === "production" ? ".vercel.app" : undefined, // ✅ Allow across Vercel subdomains
    }

    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: { user },
    });
};

// --- SIGNUP ---
const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await UserModel.create(req.body);
    // const newUser = await UserModel.create({
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password,
    //     confirmpassword: req.body.confirmpassword
    // });
    createAndSendToken(newUser, 201, res);
});

// --- LOGIN ---
const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError("Please provide your email & password", 400));
    }

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password!))) {
        return next(new AppError("Incorrect email or password", 401));
    }

    createAndSendToken(user, 200, res);
});

// --- LOGOUT ---
const logout = (req: Request, res: Response) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000), // expires in 10s
        httpOnly: true,
    });

    res.status(200).json({ status: "success" });
};


// --- PROTECT ROUTE ---
const protect = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next(new AppError("Login to gain access", 401));

    // Verify token and cast to our payload
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;

    const currentUser = await UserModel.findById(decoded.id);
    if (!currentUser) return next(new AppError("User no longer exists", 401));

    if (decoded.iat && currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError("User recently changed password", 401));
    }

    req.user = currentUser;
    next();
});

// --- RESTRICT ROLES ---
const restrictTo = (...roles: Array<"user" | "creator" | "admin" | "guide">) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission", 403));
        }
        next();
    };
};

// --- FORGOT PASSWORD ---
const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) return next(new AppError("No user with that email", 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get("host")}${req.originalUrl}/${resetToken}`;
    console.log("Reset URL:", resetURL);
    const message = `Reset your password using: ${resetURL}.\n 
        If you did not request this, ignore this email.  `;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Reset", message
        });
        res.status(200).json({
            status: "success",
            message: "Token sent to email"
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(
            new AppError("Error sending email, try again later", 500));
    }
});

// --- RESET PASSWORD ---
const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError("Token invalid or expired", 400));

    user.password = req.body.password;
    user.confirmpassword = req.body.confirmpassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createAndSendToken(user, 200, res);
});

// --- UPDATE PASSWORD ---
const updatePassword = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await UserModel.findById(req.user?.id).select("+password");
    if (!user) return next(new AppError("User not found", 404));

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password!))) {
        return next(new AppError("Current password is wrong", 401));
    }

    user.password = req.body.password;
    user.confirmpassword = req.body.confirmpassword;
    await user.save();

    createAndSendToken(user, 200, res);
});

export const authController = {
    signup,
    login,
    logout,
    protect,
    restrictTo,
    forgotPassword,
    resetPassword,
    updatePassword,
};