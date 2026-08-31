import { Router } from "express";
import { 
    getPostComments, addComment, updateComment, 
    deleteComment, toggleLikeComment, togglePinComment 
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { commentSchema } from "../utils/validationSchemas.js";

const router = Router();

router.route("/post/:postId")
    .get(verifyJWT, getPostComments)
    .post(verifyJWT, validate(commentSchema), addComment);

router.route("/:commentId")
    .patch(verifyJWT, updateComment)
    .delete(verifyJWT, deleteComment);

router.post("/:commentId/like", verifyJWT, toggleLikeComment);

router.post("/:commentId/pin", verifyJWT, togglePinComment);

export default router;