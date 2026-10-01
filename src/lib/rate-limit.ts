/**
 * Token-bucket rate limiter. Uses Upstash Redis (REST-based — works from Vercel's
 * serverless functions without holding a persistent connection, unlike a plain
 * ioredis/TCP client) when UPSTASH_REDIS_REST_URL/TOKEN are set, so the limit is
 * actually shared across Vercel's multiple instances; falls back to the original
 * in-memory map otherwise (works, just per-instance — fine for a single deployment,
 * not for real distributed rate limiting). See docs/ARCHITECTURE.md §8.
 */
import { Redis } from "@upstash/redis";

const buckets = new Map<string, { count: number; resetAt: number }>();

let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

function rateLimitInMemory(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; remaining: number }> {
  const client = getRedis();
  if (!client) return rateLimitInMemory(key, limit, windowMs);

  try {
    const bucketKey = `ratelimit:${key}`;
    const count = await client.incr(bucketKey);
    if (count === 1) {
      await client.pexpire(bucketKey, windowMs);
    }
    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (err) {
    // Redis hiccup shouldn't take down the endpoint it's protecting — fail open via
    // the in-memory limiter for this request rather than blocking everyone.
    console.error("[rate-limit] Redis error, falling back to in-memory:", err instanceof Error ? err.message : err);
    return rateLimitInMemory(key, limit, windowMs);
  }
}
