import { Router } from "express";
import { validateBody } from "../../../middlewares/validate.middleware.js";
import { authRateLimiter } from "../../../middlewares/rateLimiter.middleware.js";
import { createAuthMiddleware } from "../../../middlewares/auth.base.middleware.js";
import { env } from "../../../config/env.js";
import { User } from "./user.model.js";
import {
  userSignupSchema,
  userSignupVerifySchema,
  userSigninSchema,
  userSigninVerifySchema,
  updateUserProfileSchema,
} from "./user.auth.validator.js";
import {
  signupController,
  signupVerifyController,
  signinController,
  signinVerifyController,
  refreshController,
  logoutController,
  getProfileController,
  updateProfileController,
} from "./user.auth.controller.js";

const router = Router();

// User authentication middleware
const userAuth = createAuthMiddleware(env.USER_JWT_SECRET, async (userId) => {
  return User.findById(userId);
});

// Public routes
router.post(
  "/signup",
  authRateLimiter,
  validateBody(userSignupSchema),
  signupController,
);
router.post(
  "/signup/verify",
  authRateLimiter,
  validateBody(userSignupVerifySchema),
  signupVerifyController,
);
router.post(
  "/signin",
  authRateLimiter,
  validateBody(userSigninSchema),
  signinController,
);
router.post(
  "/signin/verify",
  authRateLimiter,
  validateBody(userSigninVerifySchema),
  signinVerifyController,
);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);

// Protected routes
router.use(userAuth);
router.get("/profile", getProfileController);
router.put(
  "/profile",
  validateBody(updateUserProfileSchema),
  updateProfileController,
);

export default router;
