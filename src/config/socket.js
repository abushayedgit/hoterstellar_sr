import { Server } from "socket.io";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let io = null;

export const initializeSocket = (server) => {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info("Socket connected", { socketId: socket.id });

    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { socketId: socket.id });
    });
  });

  logger.info("Socket.IO initialized");
  return io;
};

export const getIO = () => {
  return io;
};
