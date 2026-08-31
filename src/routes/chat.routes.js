import { Router } from "express";
import { 
    getOrCreateConversation, getConversationsList, 
    sendMessage, getMessages, markAsSeen 
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/conversation", verifyJWT, getOrCreateConversation);

router.get("/conversations", verifyJWT, getConversationsList);

router.post("/message/:conversationId", verifyJWT, upload.single("file"), sendMessage);

router.get("/messages/:conversationId", verifyJWT, getMessages);

router.post("/seen/:conversationId", verifyJWT, markAsSeen);

export default router;
