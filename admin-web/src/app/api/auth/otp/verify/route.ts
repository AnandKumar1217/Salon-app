import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/mongodb-service';
import { signJwtToken } from '@/lib/jwt-security';
import { checkRateLimit, getClientIp, buildRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { phone, code } = await req.json().catch(() => ({}));

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and verification code are required.' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const cleanCode = String(code).trim();

    // Rate limit check: max 5 attempts per phone/IP per 15 minutes
    const ipCheck = await checkRateLimit(clientIp, RATE_LIMITS.OTP_VERIFY);
    if (!ipCheck.allowed) return buildRateLimitResponse(ipCheck);

    const phoneCheck = await checkRateLimit(`verify_${cleanPhone}`, RATE_LIMITS.OTP_VERIFY);
    if (!phoneCheck.allowed) return buildRateLimitResponse(phoneCheck);

    let isValid = false;
    let db: any = null;

    try {
      db = await getDatabase();
      const otpDoc = await db.collection('otps').findOne({ phone: cleanPhone });

      if (otpDoc) {
        if (new Date() > new Date(otpDoc.expiresAt)) {
          return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
        }

        const candidateHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
        if (candidateHash === otpDoc.otpHash) {
          isValid = true;
          // Invalidate used OTP immediately
          await db.collection('otps').deleteOne({ phone: cleanPhone });
        }
      }
    } catch (dbErr) {
      console.warn('MongoDB OTP lookup notice:', dbErr);
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 401 });
    }

    // Locate or create user in MongoDB
    let user: any = null;
    let isNewUser = false;

    if (db) {
      user = await db.collection(COLLECTIONS.USERS).findOne({ phone: cleanPhone });
      if (!user) {
        isNewUser = true;
        const nowIso = new Date().toISOString();
        user = {
          id: `usr_${Date.now()}`,
          name: 'Glamora Guest',
          phone: cleanPhone,
          roles: ['customer'],
          activeMode: 'CUSTOMER',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await db.collection(COLLECTIONS.USERS).insertOne(user);
      }
    } else {
      user = {
        id: `usr_${Date.now()}`,
        name: 'Glamora Guest',
        phone: cleanPhone,
        roles: ['customer'],
        activeMode: 'CUSTOMER',
      };
    }

    const token = signJwtToken({
      uid: user.id || user._id.toString(),
      email: user.email || `${cleanPhone}@glamora.phone`,
      name: user.name || 'Glamora Guest',
      role: 'customer',
      roles: user.roles || ['customer'],
    });

    return NextResponse.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user.id || user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error: any) {
    console.error('API /auth/otp/verify error:', error);
    return NextResponse.json({ error: error.message || 'OTP verification failed' }, { status: 500 });
  }
}

