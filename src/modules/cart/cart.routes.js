import { Router } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.base.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { validateObjectIdParam } from "../../middlewares/objectId.middleware.js";
import { env } from "../../config/env.js";
import { User } from "../auth/user/user.model.js";
import {
  addToCartSchema,
  updateCartItemSchema,
  mergeCartSchema,
} from "./cart.validator.js";
import {
  getCartController,
  addToCartController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
  mergeGuestCartController,
} from "./cart.controller.js";

const router = Router();

// User authentication middleware
const userAuth = createAuthMiddleware(env.USER_JWT_SECRET, async (userId) => {
  return User.findById(userId);
});

// All routes require user authentication
router.use(userAuth);

// Get cart
router.get("/", getCartController);

// Add item to cart
router.post("/items", validateBody(addToCartSchema), addToCartController);

// Update cart item
router.put(
  "/items/:foodId",
  validateObjectIdParam("foodId"),
  validateBody(updateCartItemSchema),
  updateCartItemController,
);

// Remove item from cart
router.delete(
  "/items/:foodId",
  validateObjectIdParam("foodId"),
  removeCartItemController,
);

// Clear cart
router.delete("/", clearCartController);

// Merge guest cart
router.post("/merge", validateBody(mergeCartSchema), mergeGuestCartController);

export default router;
