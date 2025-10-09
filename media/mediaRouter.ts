import { Router } from "express";
import mediaControllers from "../media/mediaControllers";
import { authController } from "../users/controllers/authControllers";

const router = Router();

// Media Routes

router.route("/")
    .get(authController.protect, mediaControllers.getAllMedia)
    .post(authController.protect, mediaControllers.uploadMedia);

router.route("/:id")
    .get(authController.protect, mediaControllers.getMedia)
    .delete(authController.protect, authController.restrictTo("admin", "guide"), mediaControllers.deleteMedia)
    .patch(authController.protect, mediaControllers.updateMedia);

// Stats Routes
router.get("/media-stats", authController.protect, mediaControllers.getMediaStats);
router.get("/top-5", authController.protect, mediaControllers.getTop5Media);

export default router;
