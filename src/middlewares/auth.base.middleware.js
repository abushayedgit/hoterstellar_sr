import { AuthenticationError } from '../errors/AuthenticationError.js';
import jwt from 'jsonwebtoken';

export const verifyAccessToken = (token, secret) => {
  try {
    // console.log('Verifying access token:', token, 'with secret:', secret);
    return jwt.verify(token, secret);
  } catch (error) {
    // console.error('Token verification failed:', error);
    throw new AuthenticationError('Invalid or expired access token');
  }
};

export const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  // console.log('Authorization header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Access token required');
  }
  return authHeader.split(' ')[1];
};

export const createAuthMiddleware = (secret, getUserById) => {
  return async (req, res, next) => {
    try {
      const token = extractBearerToken(req);

      const payload = verifyAccessToken(token, secret);

      // console.log('Access token payload:', payload);

      const user = await getUserById(
        payload?.subs || payload.id || payload.adminId,
      );

      // console.log('Fetched user from DB:', user);
      if (!user) {
        throw new AuthenticationError('Account not found');
      }

      if (user.isActive === false) {
        throw new AuthenticationError('Account is deactivated');
      }

      req.auth = {
        ...payload,
        user,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
