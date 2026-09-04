import { env } from '../config/env.js';

/**
 * Additional security headers beyond Helmet defaults
 */
export const securityHeadersMiddleware = (req, res, next) => {
  // Prevent browsers from MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Strict transport security (in production)
  if (env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'"
  );
  
  next();
};

/**
 * Basic request sanitization - strip null bytes and control characters
 */
export const sanitizeRequestMiddleware = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove null bytes and control characters
        obj[key] = obj[key].replace(/[\u0000-\u001F\u007F]/g, '');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};
