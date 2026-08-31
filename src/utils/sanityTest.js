import dotenv from "dotenv";
import mongoose from "mongoose";
import { app } from "../app.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Session } from "../models/session.model.js";
import { Connection } from "../models/connection.model.js";
import { Follow } from "../models/follow.model.js";
import { Comment } from "../models/comment.model.js";
import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Notification } from "../models/notification.model.js";
import { Reaction } from "../models/reaction.model.js";
import { ProfileVisit } from "../models/profileVisit.model.js";
import { logger } from "./logger.js";

dotenv.config({ path: "./.env" });

const runSanityCheck = async () => {
    logger.info("Initializing Compile & Load Verification Checks...");

    try {
        // 1. Verify app loads
        if (app) {
            logger.info("✓ Express application loaded successfully.");
        }

        // 2. Validate models compiled successfully
        const modelNames = mongoose.modelNames();
        logger.info(`Database Models registered: ${modelNames.join(", ")}`);
        
        if (modelNames.length >= 10) {
            logger.info("✓ Backend Sanity Checks Passed. All modules and models loaded correctly.");
            process.exit(0);
        } else {
            logger.error("Missing expected models. Check configuration.");
            process.exit(1);
        }
    } catch (error) {
        logger.error("Sanity check encountered errors:", error);
        process.exit(1);
    }
};

runSanityCheck();
