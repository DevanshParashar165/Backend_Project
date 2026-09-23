import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { setupSwagger } from "./utils/swagger.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://devconnect-nyfy.onrender.com",
  "https://project-frontend-beige.vercel.app/"
];

// Security configurations
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Express 5 query/params writeability workaround for sanitization/validation middlewares
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: { ...req.query },
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  if (req.params) {
    Object.defineProperty(req, 'params', {
      value: { ...req.params },
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  next();
});

app.use(mongoSanitize());

// API Documentations (Swagger)
setupSwagger(app);

// Routes imports
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRouter from "./routes/comment.routes.js";
import connectionRouter from "./routes/connection.routes.js";
import chatRouter from "./routes/chat.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";

// Routes declarations
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/messages", chatRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  });
});

export { app };