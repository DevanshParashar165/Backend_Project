import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const commentRouter = Router();

commentRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

commentRouter.route("/:videoId").get(getVideoComments).post(upload.none(),addComment);
commentRouter.route("/c/:commentId").delete(deleteComment).patch(upload.none(),updateComment);

export default commentRouter