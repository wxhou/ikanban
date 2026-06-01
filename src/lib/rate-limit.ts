// Note: in-memory rate limit is fine for a single-process Next.js deployment.
// If we ever scale to multiple instances, this MUST be replaced with a shared
// store (Redis, etc.) so limits apply across instances.

const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = buckets.get(key) ?? [];
  // Drop expired entries (lazy GC).
  const fresh = hits.filter((t) => t > windowStart);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
