import { Router } from "express";
import { 
    createPost, getPostFeed, updatePost, deletePost, 
    toggleReaction, toggleBookmark, voteInPoll 
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/")
    .post(
        verifyJWT,
        upload.fields([{ name: "images", maxCount: 5 }]),
        createPost
    )
    .get(verifyJWT, getPostFeed);

router.route("/:id")
    .patch(verifyJWT, updatePost)
    .delete(verifyJWT, deletePost);

router.post("/:id/reaction", verifyJWT, toggleReaction);

router.post("/:id/bookmark", verifyJWT, toggleBookmark);

router.post("/:id/vote", verifyJWT, voteInPoll);

export default router;
