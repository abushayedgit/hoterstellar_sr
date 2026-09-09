import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const validateProductionConfig = () => {
  if (env.NODE_ENV === 'production') {
    const requiredVars = [
      'MONGODB_URI',
      'ADMIN_JWT_SECRET',
      'USER_JWT_SECRET',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'UPSTASH_REDIS_NATIVE_URL',
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      logger.error('Missing required production environment variables:', {
        missingVars,
      });
      process.exit(1);
    }

    logger.info('Production configuration validated');
  }
};
