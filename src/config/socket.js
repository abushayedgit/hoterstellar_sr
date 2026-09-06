import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let io = null;

export const initializeSocket = (server) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
  });

  const adminNamespace = io.of("/admin");

  // Authentication middleware for admin namespace
  adminNamespace.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, env.ADMIN_JWT_SECRET);
      socket.adminId = decoded.sub || decoded.adminId;
      socket.adminRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  adminNamespace.on("connection", (socket) => {
    logger.info("Admin socket connected", {
      adminId: socket.adminId,
      socketId: socket.id,
    });

    // Optionally join room based on role
    if (socket.adminRole) {
      socket.join(`role:${socket.adminRole}`);
    }

    socket.on("disconnect", (reason) => {
      logger.info("Admin socket disconnected", {
        adminId: socket.adminId,
        socketId: socket.id,
        reason,
      });
    });
  });

  logger.info("Socket.IO initialized with /admin namespace");
  return io;
};

export const getIO = () => io;
