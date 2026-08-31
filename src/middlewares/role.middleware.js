import { ApiError } from "../utils/apiError.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized access"));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ApiError(403, `User role '${req.user.role}' is not authorized to access this resource`));
        }
        next();
    };
};
