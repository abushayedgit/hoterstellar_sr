import {
  userSignup,
  userSignupVerify,
  userSignin,
  userSigninVerify,
  userRefresh,
  userLogout,
  getUserProfile,
  updateUserProfile,
} from "./user.auth.service.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../../../utils/cookie.utils.js";
import { env } from "../../../config/env.js";
import { SECURITY } from "../../../constants/security.js";

export const signupController = async (req, res, next) => {
  try {
    const userData = req.body;

    await userSignup(userData);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Verification code sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

export const signupVerifyController = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const deviceInfo = req.headers["user-agent"] || "Unknown device";

    const result = await userSignupVerify(email, code, deviceInfo);

    setRefreshTokenCookie(
      res,
      env.USER_REFRESH_COOKIE_NAME,
      result.refreshToken,
      SECURITY.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Account created successfully",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signinController = async (req, res, next) => {
  try {
    const { email } = req.body;

    await userSignin(email);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "If the email exists, a verification code has been sent",
    });
  } catch (error) {
    next(error);
  }
};

export const signinVerifyController = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const deviceInfo = req.headers["user-agent"] || "Unknown device";

    const result = await userSigninVerify(email, code, deviceInfo);

    setRefreshTokenCookie(
      res,
      env.USER_REFRESH_COOKIE_NAME,
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
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.[env.USER_REFRESH_COOKIE_NAME] || req.body.refreshToken;
    const deviceInfo = req.headers["user-agent"] || "Unknown device";

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        code: "AUTHENTICATION_ERROR",
        message: "Refresh token required",
      });
    }

    const result = await userRefresh(refreshToken, deviceInfo);

    setRefreshTokenCookie(
      res,
      env.USER_REFRESH_COOKIE_NAME,
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
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.[env.USER_REFRESH_COOKIE_NAME] || req.body.refreshToken;

    await userLogout(refreshToken);

    clearRefreshTokenCookie(res, env.USER_REFRESH_COOKIE_NAME);

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

export const getProfileController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const user = await getUserProfile(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Profile retrieved",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const updateData = req.body;

    const user = await updateUserProfile(userId, updateData);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Profile updated",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
