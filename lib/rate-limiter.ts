/**
 * In-memory rate limiter for Next.js API routes.
 * Stores request counts per IP in a Map with automatic expiration.
 * This is sufficient for a single server / serverless preview environment.
 * For production at scale, replace with a Redis-backed solution (e.g. Upstash Rate Limit).
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Store: ip -> { count, windowStart }
const ipRequestMap = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, entry] of ipRequestMap.entries()) {
        // Remove entries older than 10 minutes
        if (now - entry.windowStart > 10 * 60 * 1000) {
          ipRequestMap.delete(ip);
        }
      }
    },
    5 * 60 * 1000
  );
}

interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  /** How many requests are left in this window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
}

/**
 * Check if the given IP is allowed to make a request.
 * @param ip - The client IP address
 * @param options - Rate limit configuration
 */
export function checkRateLimit(ip: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs } = options;

  const existing = ipRequestMap.get(ip);

  if (!existing || now - existing.windowStart >= windowMs) {
    // New window — reset the counter
    ipRequestMap.set(ip, { count: 1, windowStart: now });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  // Within the existing window
  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.windowStart + windowMs,
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetAt: existing.windowStart + windowMs,
  };
}

/**
 * Extract the real IP from a Next.js request, respecting common proxy headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; take the first
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // Fallback — not ideal but prevents crashes
  return 'unknown';
}
