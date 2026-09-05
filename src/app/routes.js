import { Router } from "express";
import adminAuthRoutes from "../modules/auth/admin/admin.auth.routes.js";
import userAuthRoutes from "../modules/auth/user/user.auth.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import categoryRoutes from "../modules/category/category.routes.js";
import foodRoutes from "../modules/food/food.routes.js";
import cartRoutes from "../modules/cart/cart.routes.js";

export const apiRoutes = Router();

apiRoutes.get("/ping", (req, res) => {
  return res.status(200).json({
    success: true,
    statusCode: 200,
    code: "OK",
    message: "Pong",
    data: null,
  });
});

apiRoutes.use("/auth/admin", adminAuthRoutes);
apiRoutes.use("/auth/user", userAuthRoutes);
apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/users", userRoutes);
apiRoutes.use("/categories", categoryRoutes);
apiRoutes.use("/foods", foodRoutes);
apiRoutes.use("/cart", cartRoutes);
