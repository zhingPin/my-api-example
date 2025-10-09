import { Router } from "express";
import { userController } from "../controllers/userController";
import { authController } from "../controllers/authControllers";


const router = Router();

router.route("/")
    .get(userController.getAllUsers)
    .post(authController.protect, authController.restrictTo("admin"), userController.createUser);

// userRoutes.ts
router.get("/me", authController.protect, userController.getMe);

router.route("/:id")
    .get(userController.getSingleUser)
    .patch(authController.protect, userController.updateUser)
    .delete(authController.protect, authController.restrictTo("admin", "guide"),
        userController.deleteUser);

//  Get All Users
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// routes


//  Password Routes
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);
router.patch("/update-password", authController.protect, authController.updatePassword);

router.patch("/update-me", authController.protect, userController.updateMe);
router.delete("/delete-me", authController.protect, userController.deleteMe);




export default router;