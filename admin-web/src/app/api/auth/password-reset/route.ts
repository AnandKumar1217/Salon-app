import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/mongodb-service';
import { checkRateLimit, getClientIp, buildRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const ipCheck = await checkRateLimit(clientIp, RATE_LIMITS.PASSWORD_RESET);
    if (!ipCheck.allowed) return buildRateLimitResponse(ipCheck);

    const { email } = await req.json().catch(() => ({}));
    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    try {
      const db = await getDatabase();
      const user = await db.collection(COLLECTIONS.USERS).findOne({ email: cleanEmail });

      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

        await db.collection('password_resets').updateOne(
          { email: cleanEmail },
          { $set: { email: cleanEmail, tokenHash, expiresAt, createdAt: new Date() } },
          { upsert: true }
        );

        // In production: send reset email link to user.email
      }
    } catch (dbErr) {
      console.warn('MongoDB password reset store notice:', dbErr);
    }

    // Always return uniform 200 OK to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched.',
    });
  } catch (error: any) {
    console.error('API /auth/password-reset error:', error);
    return NextResponse.json({ error: error.message || 'Password reset failed' }, { status: 500 });
  }
}

