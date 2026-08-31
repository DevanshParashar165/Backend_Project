import dotenv from "dotenv";
import http from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initializeSocket } from "./socket.js";
import { logger } from "./utils/logger.js";

dotenv.config({
    path: "./.env"
});

const server = http.createServer(app);

// Initialize Socket.io server
initializeSocket(server);

connectDB()
    .then(() => {
        const port = process.env.PORT || 8000;
        server.listen(port, () => {
            logger.info(`Server is running at port : ${port}`);
            logger.info(`Swagger API docs available at http://localhost:${port}/api/v1/docs`);
        });
    })
    .catch((err) => {
        logger.error("MONGO db connection failed !!! ", err);
    });
