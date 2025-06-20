import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    console.log(`\nMongoDB connected !! DB HOST ${connectionInstance.connection.host}`);

    // Optional safe drop index (only if exists)
    const indexes = await mongoose.connection.collection('tweets').indexes();
    const indexExists = indexes.some(idx => idx.name === 'owner_1');

    if (indexExists) {
      await mongoose.connection.collection('tweets').dropIndex('owner_1');
      console.log("Dropped index: owner_1");
    } else {
      console.log("Index 'owner_1' does not exist. Skipping drop.");
    }

  } catch (error) {
    console.log("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
