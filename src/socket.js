import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "./models/user.model.js";
import { logger } from "./utils/logger.js";

let io = null;
const userSocketMap = new Map(); // userId -> socket.id

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.CORS_ORIGIN || "http://localhost:5173", "https://devconnect-nyfy.onrender.com"],
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Authentication middleware for Socket.io handshakes
    io.use(async (socket, next) => {
        try {
            // Retrieve token from cookies or auth headers
            const cookiesString = socket.handshake.headers.cookie || "";
            const tokenCookie = cookiesString
                .split("; ")
                .find(row => row.startsWith("accessToken="));
            
            let token = tokenCookie ? tokenCookie.split("=")[1] : null;

            if (!token) {
                token = socket.handshake.auth?.token || socket.handshake.query?.token;
            }

            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select("-password");

            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            logger.error("Socket authentication failed:", error.message);
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user._id.toString();
        userSocketMap.set(userId, socket.id);
        
        logger.info(`User connected to socket: ${socket.user.username} (${socket.id})`);
        
        // Broadcast user online status
        io.emit("user_status", { userId, status: "online" });

        // Join personal room for personal notifications/chats
        socket.join(userId);

        // Join conversation rooms
        socket.on("join_conversation", (conversationId) => {
            socket.join(conversationId);
            logger.debug(`Socket ${socket.id} joined conversation room: ${conversationId}`);
        });

        socket.on("leave_conversation", (conversationId) => {
            socket.leave(conversationId);
            logger.debug(`Socket ${socket.id} left conversation room: ${conversationId}`);
        });

        // Handle typing indicator
        socket.on("typing", ({ conversationId, isTyping }) => {
            socket.to(conversationId).emit("typing_status", {
                conversationId,
                userId,
                isTyping
            });
        });

        socket.on("disconnect", () => {
            userSocketMap.delete(userId);
            logger.info(`User disconnected: ${socket.user.username}`);
            
            // Broadcast offline status
            io.emit("user_status", { userId, status: "offline" });
        });
    });

    return io;
};

// Helper to push real-time events to user room
export const sendRealTimeEvent = (userId, eventName, data) => {
    if (io) {
        io.to(userId.toString()).emit(eventName, data);
        logger.debug(`Emitted event ${eventName} to user room: ${userId}`);
    } else {
        logger.warn("Socket.io not initialized. Cannot emit event.");
    }
};

// Helper to broadcast events to a specific conversation room
export const sendConversationEvent = (conversationId, eventName, data) => {
    if (io) {
        io.to(conversationId.toString()).emit(eventName, data);
        logger.debug(`Emitted event ${eventName} to conversation: ${conversationId}`);
    }
};
export { io };
