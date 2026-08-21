import { DatabaseService } from '../../database/db.js';
import { getRedisClient, isRedisConnected } from '../cache/redis.js';
import { Logger } from '../logger/logger.js';

export class AuthMiddleware {
  static authenticate() {
    const dbService = DatabaseService.getInstance();

    return async (req, res, next) => {
      let apiKey = req.headers['x-api-key'];

      if (!apiKey && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'ApiKey')) {
          apiKey = parts[1];
        }
      }

      if (!apiKey) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: "Eksik API Key. Lütfen 'X-API-Key' veya 'Authorization: Bearer <key>' başlığını ekleyin."
          },
          meta: {
            timestamp: new Date().toISOString(),
            correlation_id: req.correlationId || `req_${Date.now()}`
          }
        });
        return;
      }

      const cacheKey = `{cache}:tenant:${apiKey}`;
      let authData = null;

      // 1. Try Redis Cache
      try {
        const redis = getRedisClient();
        if (redis && isRedisConnected()) {
          const cachedVal = await redis.get(cacheKey);
          if (cachedVal) {
            authData = JSON.parse(cachedVal);
          }
        }
      } catch (err) {
        Logger.warn('Redis auth cache read failed, falling back to database', { error: err.message });
      }

      // 2. Database Lookup on Cache Miss
      if (!authData) {
        const found = dbService.getApiKey(apiKey);
        if (found) {
          authData = found;

          // Populate Redis Cache
          try {
            const redis = getRedisClient();
            if (redis && isRedisConnected()) {
              await redis.setex(cacheKey, 3600, JSON.stringify(authData));
            }
          } catch (err) {
            Logger.warn('Redis auth cache write failed', { error: err.message });
          }
        }
      }

      if (!authData || !authData.tenant) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: "Geçersiz, süresi dolmuş veya pasife alınmış API Key."
          },
          meta: {
            timestamp: new Date().toISOString(),
            correlation_id: req.correlationId || `req_${Date.now()}`
          }
        });
        return;
      }

      req.tenant = authData.tenant;
      req.apiKeyInfo = authData.keyInfo;

      next();
    };
  }
}
