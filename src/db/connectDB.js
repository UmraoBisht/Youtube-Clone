import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`\n MongoDB Connected: ${connectionInstance.connection.host}`);
    // console.log(connectionInstance.connection);
  } catch (error) {
    console.error("MONGODB Connection Failed: ",error);
    process.exit(1);
  }
};
