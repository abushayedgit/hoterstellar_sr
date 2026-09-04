import { env } from "../config/env.js";

export const getCookieOptions = (maxAge = null) => {
  const options = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };

  if (maxAge) {
    options.maxAge = maxAge;
  }

  return options;
};

export const setRefreshTokenCookie = (
  res,
  cookieName,
  token,
  maxAge = 7 * 24 * 60 * 60 * 1000,
) => {
  res.cookie(cookieName, token, getCookieOptions(maxAge));
};

export const clearRefreshTokenCookie = (res, cookieName) => {
  res.clearCookie(cookieName, getCookieOptions());
};
