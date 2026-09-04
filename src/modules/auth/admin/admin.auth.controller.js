import {
  adminLogin,
  adminRefresh,
  adminLogout,
  changePassword,
  createAdmin,
  requestPasswordReset,
  resetPassword,
} from "./admin.auth.service.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../../../utils/cookie.utils.js";
import { env } from "../../../config/env.js";
import { SECURITY } from "../../../constants/security.js";

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const deviceInfo = req.headers["user-agent"] || "Unknown device";

    const result = await adminLogin({ email, password, deviceInfo });

    // Set refresh token cookie
    setRefreshTokenCookie(
      res,
      env.ADMIN_REFRESH_COOKIE_NAME,
      result.refreshToken,
      SECURITY.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Login successful",
      data: {
        accessToken: result.accessToken,
        admin: result.admin,
        mustChangePassword: result.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.[env.ADMIN_REFRESH_COOKIE_NAME] || req.body.refreshToken;
    const deviceInfo = req.headers["user-agent"] || "Unknown device";

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        code: "AUTHENTICATION_ERROR",
        message: "Refresh token required",
      });
    }

    const result = await adminRefresh(refreshToken, deviceInfo);

    setRefreshTokenCookie(
      res,
      env.ADMIN_REFRESH_COOKIE_NAME,
      result.refreshToken,
      SECURITY.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Token refreshed",
      data: {
        accessToken: result.accessToken,
        admin: result.admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.[env.ADMIN_REFRESH_COOKIE_NAME] || req.body.refreshToken;

    await adminLogout(refreshToken);

    clearRefreshTokenCookie(res, env.ADMIN_REFRESH_COOKIE_NAME);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

export const changePasswordController = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.auth.adminId;

    await changePassword(adminId, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminController = async (req, res, next) => {
  try {
    const adminData = req.body;
    const createdByAdminId = req.auth.adminId;

    const admin = await createAdmin(adminData, createdByAdminId);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Admin created successfully",
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordResetController = async (req, res, next) => {
  try {
    const { email } = req.body;

    await requestPasswordReset(email);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    await resetPassword(token, newPassword);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};
