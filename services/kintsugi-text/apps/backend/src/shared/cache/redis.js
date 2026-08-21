import Redis from 'ioredis';
import { env } from '../../config/env.js';
import { Logger } from '../logger/logger.js';

let redisClient = null;
let isConnected = false;
let isInitialized = false;

function parseClusterNodes(nodesString) {
  if (!nodesString || typeof nodesString !== 'string') return [];
  return nodesString
    .split(',')
    .map(node => node.trim())
    .filter(Boolean)
    .map(node => {
      const [host, port] = node.split(':');
      return {
        host: host || '127.0.0.1',
        port: port ? parseInt(port, 10) : 6379
      };
    });
}

export function createRedisClient() {
  if (isInitialized) return redisClient;
  isInitialized = true;

  const clusterNodes = parseClusterNodes(env.REDIS_CLUSTER_NODES);

  if (clusterNodes.length > 0) {
    Logger.info('Initializing Redis Cluster connection', { nodesCount: clusterNodes.length });
    redisClient = new Redis.Cluster(clusterNodes, {
      enableReadyCheck: true,
      maxRedirections: 16,
      scaleReads: 'all',
      redisOptions: {
        password: env.REDIS_PASSWORD || undefined,
        connectTimeout: 5000
      },
      clusterRetryStrategy(times) {
        const delay = Math.min(100 * Math.pow(2, times), 2000);
        Logger.warn('Redis Cluster reconnecting', { attempt: times, delayMs: delay });
        return delay;
      }
    });
  } else if (env.REDIS_URL) {
    Logger.info('Initializing Standalone Redis connection', { url: env.REDIS_URL });
    redisClient = new Redis(env.REDIS_URL, {
      password: env.REDIS_PASSWORD || undefined,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(100 * Math.pow(2, times), 2000);
      }
    });
  } else {
    Logger.warn('No REDIS_CLUSTER_NODES or REDIS_URL configured. Operating in local in-memory fallback mode.');
    return null;
  }

  redisClient.on('connect', () => {
    isConnected = true;
    Logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    isConnected = true;
    Logger.info('Redis client ready');
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    Logger.error('Redis client error', { error: err.message });
  });

  redisClient.on('end', () => {
    isConnected = false;
    Logger.warn('Redis connection ended');
  });

  return redisClient;
}

export function getRedisClient() {
  if (!isInitialized) {
    createRedisClient();
  }
  return redisClient;
}

export function isRedisConnected() {
  return isConnected && redisClient !== null && (redisClient.status === 'ready' || redisClient.status === 'connect');
}
