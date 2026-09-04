import { env } from "../config/env.js";

export const BUSINESS_TIMEZONE = env.BUSINESS_TIMEZONE;

export const currentTimeInBusinessTz = () => {
  return new Date().toLocaleString("en-US", { timeZone: BUSINESS_TIMEZONE });
};
