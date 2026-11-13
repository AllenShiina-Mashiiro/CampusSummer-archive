import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    globalForRedis.redis.on("error", () => {
      // Redis is an optional cache during local development.
    });
  }
  return globalForRedis.redis;
}
