import dotenv from "dotenv";
import connectDB from "../db/index.js";
import { app } from "../app.js";

dotenv.config({ path: "./.env" });

let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log("MongoDB connected successfully!");
    } catch (err) {
      console.error("MongoDB connection failed:", err);
      return res.status(500).json({ message: "DB connection failed" });
    }
  }

  app(req, res); // pass request to Express app
};

export default handler;
