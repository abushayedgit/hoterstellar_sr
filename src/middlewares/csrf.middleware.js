import crypto from 'crypto';
import { ForbiddenError } from '../errors/ForbiddenError.js';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const cookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const crossSite = true;

  return {
    httpOnly: false, // double-submit: JS must read it
    secure: isProd, // required with SameSite=None; good hygiene in prod either way
    sameSite: crossSite ? 'none' : 'lax', // 'none' only for cross-site prod
    path: '/',
  };
};

export const setCsrfCookie = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, cookieOptions());
  }
  next();
};

export const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.includes(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.body?._csrf;
  console.log('cookieToken:', cookieToken, req.cookies?.[CSRF_COOKIE_NAME]);
  console.log(
    'headerToken:',
    headerToken,
    req.body?._csrf,
    req.headers[CSRF_HEADER_NAME],
  );
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new ForbiddenError('CSRF token validation failed'));
  }

  next();
};
