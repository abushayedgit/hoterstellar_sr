import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
let retryCount = 0;

export const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected successfully");
    retryCount = 0;
  });

  mongoose.connection.on("error", (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  const options = {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 50,
    minPoolSize: 5,
    socketTimeoutMS: 45000,
    family: 4,
    autoIndex: env.NODE_ENV === "development",
  };

  try {
    await mongoose.connect(env.MONGODB_URI, options);
    return mongoose.connection;
  } catch (error) {
    logger.error("Failed to connect to MongoDB", error);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.info(
        `Retrying MongoDB connection (${retryCount}/${MAX_RETRIES}) in ${RETRY_DELAY / 1000}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDB();
    }

    throw error;
  }
};

export const disconnectDatabase = async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
};
