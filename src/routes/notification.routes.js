import { Router } from "express";
import { 
    getNotifications, markAsRead, markAllAsRead 
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyJWT, getNotifications);

router.patch("/all/read", verifyJWT, markAllAsRead);

router.patch("/:id", verifyJWT, markAsRead);

export default router;
