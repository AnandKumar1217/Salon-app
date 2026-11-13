import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/mongodb-service';
import { signJwtToken } from '@/lib/jwt-security';
import { checkRateLimit, getClientIp, buildRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.CUSTOMER_AUTH);
    if (!rateCheck.allowed) {
      return buildRateLimitResponse(rateCheck);
    }

    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const db = await getDatabase();
    const user = await db.collection(COLLECTIONS.USERS).findOne({ email: cleanEmail });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = signJwtToken({
      uid: user.id || user._id.toString(),
      email: user.email,
      name: user.name || 'Customer',
      role: 'customer',
      roles: user.roles || ['customer'],
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id || user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles: user.roles || ['customer'],
      },
    });
  } catch (error: any) {
    console.error('API /auth/customer/login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
