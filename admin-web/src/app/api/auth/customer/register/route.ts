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

    const { name, email, phone, password } = await req.json().catch(() => ({}));
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required for registration.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    const db = await getDatabase();

    const existing = await db.collection(COLLECTIONS.USERS).findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nowIso = new Date().toISOString();

    const newUser = {
      id: `usr_${Date.now()}`,
      name: String(name).trim(),
      email: cleanEmail,
      phone: phone ? String(phone).trim() : '',
      passwordHash,
      roles: ['customer'],
      activeMode: 'CUSTOMER',
      savedSalonIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.collection(COLLECTIONS.USERS).insertOne(newUser as any);

    const token = signJwtToken({
      uid: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: 'customer',
      roles: ['customer'],
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        roles: newUser.roles,
      },
    });
  } catch (error: any) {
    console.error('API /auth/customer/register error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
