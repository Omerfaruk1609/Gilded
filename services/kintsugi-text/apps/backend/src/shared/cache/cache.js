import crypto from 'crypto';
import { getRedisClient, isRedisConnected } from './redis.js';
import { Logger } from '../logger/logger.js';

export class SemanticCacheService {
  static instance;
  localCache = new Map();
  ttlMs = 1000 * 60 * 60; // 1 Saat Önbellek Süresi (in-memory fallback)
  ttlSeconds = 60 * 60;   // 1 Hour TTL in Redis

  static getInstance() {
    if (!SemanticCacheService.instance) {
      SemanticCacheService.instance = new SemanticCacheService();
    }
    return SemanticCacheService.instance;
  }

  hashText(text) {
    return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
  }

  getCacheKey(text) {
    const hash = this.hashText(text);
    // Redis Cluster Hash Tag format: {cache}:mod:<hash> ensures all semantic cache keys hash to the same slot
    return `{cache}:mod:${hash}`;
  }

  async get(text) {
    const key = this.getCacheKey(text);

    // 1. Try Redis Cluster / Standalone Client
    try {
      const redis = getRedisClient();
      if (redis && isRedisConnected()) {
        const cachedValue = await redis.get(key);
        if (cachedValue) {
          return JSON.parse(cachedValue);
        }
        return null;
      }
    } catch (err) {
      Logger.warn('Redis cache read failed, using local in-memory fallback', { error: err.message, key });
    }

    // 2. Fallback to Local In-Memory Cache
    const item = this.localCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.localCache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(text, result) {
    const key = this.getCacheKey(text);

    // 1. Try Redis Cluster / Standalone Client
    try {
      const redis = getRedisClient();
      if (redis && isRedisConnected()) {
        await redis.setex(key, this.ttlSeconds, JSON.stringify(result));
      }
    } catch (err) {
      Logger.warn('Redis cache write failed, using local in-memory fallback', { error: err.message, key });
    }

    // 2. Always maintain local in-memory fallback cache
    this.localCache.set(key, {
      value: result,
      expiresAt: Date.now() + this.ttlMs
    });

    if (this.localCache.size > 10000) {
      const firstKey = this.localCache.keys().next().value;
      this.localCache.delete(firstKey);
    }
  }
}
