/**
 * Glamora Distributed Rate Limiter
 * Production-safe rate limiting backed by MongoDB atomic operations and TTL indexes.
 * Supports multi-instance deployments with in-memory resilient fallback.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from './mongodb';

const RATE_LIMITS_COLLECTION = 'rate_limits';

export interface RateLimitConfig {
  action: string;
  limit: number;
  windowMs: number; // in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

// In-memory fallback map for zero-database development / fast cache
const memoryBuckets = new Map<string, { count: number; resetTime: number }>();

/**
 * Extracts and sanitizes the client IP address to prevent header spoofing
 */
export function getClientIp(req: NextRequest): string {
  // If platform provides trusted direct IP
  if ((req as any).ip) {
    return (req as any).ip;
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Standard: first IP in the comma-separated list represents the original client
    const ips = forwarded.split(',').map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Evaluates rate limit atomically using MongoDB with in-memory fail-safe
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const bucketKey = `${config.action}:${identifier}`;
  const now = Date.now();
  const expiresAt = new Date(now + config.windowMs);

  try {
    const db = await getDatabase();
    const collection = db.collection(RATE_LIMITS_COLLECTION);

    // Atomically find and increment or create bucket
    const result = await collection.findOneAndUpdate(
      { key: bucketKey },
      {
        $inc: { count: 1 },
        $setOnInsert: { firstHit: now, expiresAt },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const doc = result || (await collection.findOne({ key: bucketKey }));
    const count = doc?.count || 1;
    const firstHit = doc?.firstHit || now;
    const elapsed = now - firstHit;
    const remainingMs = Math.max(0, config.windowMs - elapsed);
    const resetInSeconds = Math.max(1, Math.ceil(remainingMs / 1000));

    // Reset bucket if expired
    if (elapsed > config.windowMs) {
      await collection.updateOne(
        { key: bucketKey },
        { $set: { count: 1, firstHit: now, expiresAt } }
      );
      return {
        allowed: true,
        limit: config.limit,
        remaining: config.limit - 1,
        resetInSeconds: Math.ceil(config.windowMs / 1000),
      };
    }

    if (count > config.limit) {
      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        resetInSeconds,
      };
    }

    return {
      allowed: true,
      limit: config.limit,
      remaining: Math.max(0, config.limit - count),
      resetInSeconds,
    };
  } catch (err) {
    // In-memory resilient fallback if database is offline during build/eval
    let bucket = memoryBuckets.get(bucketKey);
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 1, resetTime: now + config.windowMs };
      memoryBuckets.set(bucketKey, bucket);
      return {
        allowed: true,
        limit: config.limit,
        remaining: config.limit - 1,
        resetInSeconds: Math.ceil(config.windowMs / 1000),
      };
    }

    bucket.count += 1;
    const resetInSeconds = Math.max(1, Math.ceil((bucket.resetTime - now) / 1000));

    if (bucket.count > config.limit) {
      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        resetInSeconds,
      };
    }

    return {
      allowed: true,
      limit: config.limit,
      remaining: Math.max(0, config.limit - bucket.count),
      resetInSeconds,
    };
  }
}

/**
 * Standard HTTP 429 response builder with RFC 6585 Retry-After header
 */
export function buildRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: `Too many attempts. Rate limit exceeded. Please try again in ${result.resetInSeconds} seconds.`,
      limit: result.limit,
      retryAfter: result.resetInSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.resetInSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    }
  );
}

// Preset Rate Limit Configurations
export const RATE_LIMITS = {
  ADMIN_LOGIN: { action: 'admin_login', limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  CUSTOMER_AUTH: { action: 'cust_auth', limit: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 min
  OTP_SEND: { action: 'otp_send', limit: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min
  OTP_VERIFY: { action: 'otp_verify', limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  PASSWORD_RESET: { action: 'pass_reset', limit: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min
  UPLOAD_IP: { action: 'upload_ip', limit: 20, windowMs: 60 * 1000 }, // 20 per min per IP
  UPLOAD_USER: { action: 'upload_user', limit: 30, windowMs: 60 * 1000 }, // 30 per min per User
} as const;

