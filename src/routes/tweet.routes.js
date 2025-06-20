import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
    getAllTweet
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const tweetRouter = Router();
tweetRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this fileS
tweetRouter.route("/").post(upload.none(),createTweet).get(getAllTweet);
tweetRouter.route("/user/:userId").get(getUserTweets);
tweetRouter.route("/:tweetId").patch(upload.none(),updateTweet).delete(deleteTweet);

export default tweetRouter