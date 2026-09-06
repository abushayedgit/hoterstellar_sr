import { getIO } from "../config/socket.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import { logger } from "./logger.js";

export const emitAdminEvent = (eventName, payload) => {
  const io = getIO();
  if (!io) {
    logger.warn("Socket.IO not initialized, cannot emit event", { eventName });
    return;
  }
  io.of("/admin").emit(eventName, payload);
};

export { SOCKET_EVENTS };
