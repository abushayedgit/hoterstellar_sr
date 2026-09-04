import { Router } from "express";
import adminAuthRoutes from "../modules/auth/admin/admin.auth.routes.js";
import userAuthRoutes from "../modules/auth/user/user.auth.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import userRoutes from "../modules/user/user.routes.js";

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

// User authentication routes
apiRoutes.use("/auth/user", userAuthRoutes);

// Admin management routes
apiRoutes.use("/admin", adminRoutes);

// User management routes (admin access)
apiRoutes.use("/users", userRoutes);
