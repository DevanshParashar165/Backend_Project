import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/apiError.js";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new ApiError(429, "Too many login/register attempts. Please try again after 15 minutes."));
    }
});

export const apiRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 API requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new ApiError(429, "Too many requests. Please slow down."));
    }
});
