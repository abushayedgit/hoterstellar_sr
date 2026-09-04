import { Router } from "express";
import adminAuthRoutes from "../modules/auth/admin/admin.auth.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

export const apiRoutes = Router();

// Temporary placeholder
apiRoutes.get("/ping", (req, res) => {
  return res.status(200).json({
    success: true,
    statusCode: 200,
    code: "OK",
    message: "Pong",
    data: null,
  });
});

// Admin authentication routes
apiRoutes.use("/auth/admin", adminAuthRoutes);

// Admin management routes
apiRoutes.use("/admin", adminRoutes);
