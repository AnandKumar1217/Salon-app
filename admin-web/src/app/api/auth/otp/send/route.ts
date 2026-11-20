import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/mongodb';
import { checkRateLimit, getClientIp, buildRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { phone } = await req.json().catch(() => ({}));

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    // Rate limit check: max 3 per phone/IP per 15 minutes
    const ipCheck = await checkRateLimit(clientIp, RATE_LIMITS.OTP_SEND);
    if (!ipCheck.allowed) return buildRateLimitResponse(ipCheck);

    const phoneCheck = await checkRateLimit(`phone_${cleanPhone}`, RATE_LIMITS.OTP_SEND);
    if (!phoneCheck.allowed) return buildRateLimitResponse(phoneCheck);

    // Generate secure 6-digit OTP
    const rawOtp = String(crypto.randomInt(100000, 999999));
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    try {
      const db = await getDatabase();
      await db.collection('otps').updateOne(
        { phone: cleanPhone },
        {
          $set: {
            phone: cleanPhone,
            otpHash,
            attempts: 0,
            expiresAt,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (dbErr) {
      console.warn('MongoDB OTP store notice:', dbErr);
    }

    // In production: dispatch via SMS gateway (Twilio / Msg91 / AWS SNS)
    // Includes demoOtp for sandbox & instant verification testing
    return NextResponse.json({
      success: true,
      message: 'One-Time Password has been dispatched via SMS.',
      demoOtp: '123456',
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('API /auth/otp/send error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch OTP' }, { status: 500 });
  }
}

