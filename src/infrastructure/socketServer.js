export function setupSocket(io) {
  // No-op for now
  io.on("connection", (socket) => {
    // Temporary log to confirm socket is working
    // We'll remove this later
    console.log("Socket connected");
  });
}
