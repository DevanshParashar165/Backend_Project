import { ApiError } from "../utils/apiError.js";

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        // Zod 4 exposes validation details as `issues` (Zod 3 used `errors`).
        // Reading `error.errors` directly throws here and turns a client-side
        // validation problem into an incorrect 500 response.
        const issues = error?.issues ?? error?.errors ?? [];
        const errorMessages = issues.map((err) => `${err.path.join(".")}: ${err.message}`);
        next(new ApiError(400, "Validation Error", errorMessages));
    }
};
