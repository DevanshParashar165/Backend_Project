import { Router } from "express";
import { 
    register, verifyEmail, login, refreshAccessToken, logout, logoutAll, 
    changePassword, forgotPassword, resetPassword, getActiveSessions, 
    revokeSession, deleteAccount, getCurrentUser 
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { registerSchema, loginSchema } from "../utils/validationSchemas.js";
import { authRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post(
    "/register", 
    authRateLimiter,
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    validate(registerSchema),
    register
);

router.get("/verify-email", verifyEmail);

router.post("/login", authRateLimiter, upload.none(), validate(loginSchema), login);

router.post("/refresh-token", refreshAccessToken);

router.post("/logout", verifyJWT, logout);

router.post("/logout-all", verifyJWT, logoutAll);

router.post("/forgot-password", authRateLimiter, forgotPassword);

router.post("/reset-password", authRateLimiter, resetPassword);

router.post("/change-password", verifyJWT, changePassword);

router.get("/sessions", verifyJWT, getActiveSessions);

router.delete("/session/:id", verifyJWT, revokeSession);

router.delete("/me", verifyJWT, deleteAccount);

router.get("/me", verifyJWT, getCurrentUser);

export default router;
