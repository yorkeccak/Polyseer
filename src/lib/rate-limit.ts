/**
 * Simple in-memory IP-based rate limiter
 * For production, use Redis, Vercel KV, or similar distributed cache
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 60 * 60 * 1000);

/**
 * Rate limit configuration
 */
export const RATE_LIMIT_CONFIG = {
  maxRequests: 20,           // 20 requests per window
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Extract IP address from request headers
 */
export function getIpAddress(req: Request): string {
  // Try to get real IP from various headers (proxies, CDNs)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Check if IP is rate limited
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // No entry or expired entry - allow and create new
  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_CONFIG.windowMs;
    rateLimitStore.set(ip, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetAt,
      limit: RATE_LIMIT_CONFIG.maxRequests,
    };
  }

  // Entry exists and not expired
  if (entry.count < RATE_LIMIT_CONFIG.maxRequests) {
    // Allow and increment
    entry.count++;
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
      resetAt: entry.resetAt,
      limit: RATE_LIMIT_CONFIG.maxRequests,
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    limit: RATE_LIMIT_CONFIG.maxRequests,
  };
}

/**
 * Format rate limit error response
 */
export function rateLimitResponse(resetAt: number): Response {
  const resetDate = new Date(resetAt);
  return Response.json(
    {
      error: 'Rate limit exceeded',
      message: `Daily limit of ${RATE_LIMIT_CONFIG.maxRequests} requests reached. Try again after ${resetDate.toISOString()}`,
      limit: RATE_LIMIT_CONFIG.maxRequests,
      resetAt: resetDate.toISOString(),
    },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetDate.toISOString(),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  rateLimit: { remaining: number; resetAt: number; limit: number }
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
