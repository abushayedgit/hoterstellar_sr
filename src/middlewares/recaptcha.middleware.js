import { verifyRecaptcha } from "../infrastructure/recaptchaProvider.js";
import { BadRequestError } from "../errors/BadRequestError.js";

export const recaptchaMiddleware = async (req, res, next) => {
  try {
    const token = req.body.recaptchaToken;
    if (!token) {
      throw new BadRequestError("reCAPTCHA token is required");
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const isValid = await verifyRecaptcha(token, ip);

    if (!isValid) {
      throw new BadRequestError("reCAPTCHA verification failed");
    }

    next();
  } catch (error) {
    next(error);
  }
};
