import { getRedisClient, isRedisConnected } from '../cache/redis.js';
import { Logger } from '../logger/logger.js';

// Local Fallback Storage for Rate Limiting & Daily Quotas when Redis is offline
const localRpmStore = new Map();
const localDailyStore = new Map();

export class QuotaMiddleware {
  static rateLimit() {
    return async (req, res, next) => {
      const tenant = req.tenant || {
        id: 'tenant_gilded_default',
        rateLimitRpm: 1000,
        dailyQuota: 100000
      };

      const tenantId = tenant.id;
      const rateLimitRpm = Number(tenant.rateLimitRpm || 60);
      const dailyQuota = Number(tenant.dailyQuota || 10000);

      const now = new Date();
      const minuteTs = Math.floor(now.getTime() / 60000);
      const dateStr = now.toISOString().split('T')[0];

      // Redis Cluster Hash Tag keys
      const rateKey = `{rate}:tenant:${tenantId}:${minuteTs}`;
      const usageKey = `{usage}:tenant:${tenantId}:${dateStr}`;

      let currentRpmCount = 1;
      let currentDailyCount = 1;
      let redisSuccess = false;

      // 1. Redis Rate Limiting & Daily Counter
      try {
        const redis = getRedisClient();
        if (redis && isRedisConnected()) {
          const pipeline = redis.pipeline();
          pipeline.incr(rateKey);
          pipeline.expire(rateKey, 120);
          pipeline.incr(usageKey);
          pipeline.expire(usageKey, 172800); // 48 Hours TTL

          const results = await pipeline.exec();
          if (results && results[0] && results[0][1]) {
            currentRpmCount = results[0][1];
          }
          if (results && results[2] && results[2][1]) {
            currentDailyCount = results[2][1];
          }
          redisSuccess = true;
        }
      } catch (err) {
        Logger.warn('Redis rate limit calculation error, using local fallback', { error: err.message });
      }

      // 2. Local In-Memory Fallback if Redis failed
      if (!redisSuccess) {
        // RPM Fallback
        const localRpmKey = `${tenantId}:${minuteTs}`;
        const currentRpm = (localRpmStore.get(localRpmKey) || 0) + 1;
        localRpmStore.set(localRpmKey, currentRpm);
        currentRpmCount = currentRpm;

        // Clean up old minute keys
        if (localRpmStore.size > 500) {
          const firstKey = localRpmStore.keys().next().value;
          localRpmStore.delete(firstKey);
        }

        // Daily Quota Fallback
        const localDailyKey = `${tenantId}:${dateStr}`;
        const currentDaily = (localDailyStore.get(localDailyKey) || 0) + 1;
        localDailyStore.set(localDailyKey, currentDaily);
        currentDailyCount = currentDaily;
      }

      // 3. Set Standard Rate Limit Response Headers
      const remainingRpm = Math.max(0, rateLimitRpm - currentRpmCount);
      res.setHeader('X-RateLimit-Limit', rateLimitRpm);
      res.setHeader('X-RateLimit-Remaining', remainingRpm);
      res.setHeader('X-DailyQuota-Limit', dailyQuota);
      res.setHeader('X-DailyQuota-Remaining', Math.max(0, dailyQuota - currentDailyCount));

      // 4. Check Minute Rate Limit (RPM) Threshold
      if (currentRpmCount > rateLimitRpm) {
        res.setHeader('Retry-After', 60);
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Dakikalık istek limitiniz aşıldı (İstek Limiti: ${rateLimitRpm} RPM). Lütfen 60 saniye bekleyin.`
          },
          meta: {
            timestamp: new Date().toISOString(),
            correlation_id: req.correlationId || `req_${Date.now()}`
          }
        });
        return;
      }

      // 5. Check Daily Quota Threshold
      if (currentDailyCount > dailyQuota) {
        res.status(429).json({
          success: false,
          error: {
            code: 'DAILY_QUOTA_EXCEEDED',
            message: `Günlük toplam istek kotanız (${dailyQuota.toLocaleString()}) dolmuştur.`
          },
          meta: {
            timestamp: new Date().toISOString(),
            correlation_id: req.correlationId || `req_${Date.now()}`
          }
        });
        return;
      }

      next();
    };
  }
}
