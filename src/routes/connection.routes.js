import { Router } from "express";
import { 
    toggleFollow, sendConnectionRequest, acceptConnectionRequest, 
    rejectConnectionRequest, getConnectionsList, getPendingRequests, 
    getFollowers, getFollowing, getConnectionState 
} from "../controllers/connection.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/follow/:id", verifyJWT, toggleFollow);

router.post("/request/:id", verifyJWT, sendConnectionRequest);

router.post("/request/:id/accept", verifyJWT, acceptConnectionRequest);

router.post("/request/:id/reject", verifyJWT, rejectConnectionRequest);

router.get("/list", verifyJWT, getConnectionsList);

router.get("/requests", verifyJWT, getPendingRequests);

router.get("/followers", verifyJWT, getFollowers);

router.get("/following", verifyJWT, getFollowing);

router.get("/state/:id", verifyJWT, getConnectionState);

export default router;
