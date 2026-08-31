import { Router } from "express";
import { 
    getProfile, updateProfile, addTimelineItem, deleteTimelineItem, 
    getSuggestions, getAnalytics, getGitHubRepos, updateAvatar, 
    updateCoverImage, uploadResume 
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { updateProfileSchema } from "../utils/validationSchemas.js";

const router = Router();

router.get("/profile/:username", verifyJWT, getProfile);

router.patch("/profile", verifyJWT, validate(updateProfileSchema), updateProfile);

router.post("/profile/timeline/:type", verifyJWT, addTimelineItem);

router.delete("/profile/timeline/:type/:itemId", verifyJWT, deleteTimelineItem);

router.get("/suggestions", verifyJWT, getSuggestions);

router.get("/analytics", verifyJWT, getAnalytics);

router.get("/github/:username", verifyJWT, getGitHubRepos);

router.patch("/avatar", verifyJWT, upload.single("avatar"), updateAvatar);

router.patch("/cover-image", verifyJWT, upload.single("coverImage"), updateCoverImage);

router.patch("/resume", verifyJWT, upload.single("resume"), uploadResume);

export default router;