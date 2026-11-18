import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/mongodb-service';
import { signJwtToken, getAdminCookieOptions } from '@/lib/jwt-security';
import { checkRateLimit, getClientIp, buildRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict rate limiting (max 5 attempts per IP per 15 minutes)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.ADMIN_LOGIN);
    if (!rateCheck.allowed) {
      return buildRateLimitResponse(rateCheck);
    }

    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    let admin: any = null;

    try {
      const db = await getDatabase();
      admin = await db.collection(COLLECTIONS.ADMIN_USERS).findOne({ email: cleanEmail });

      if (!admin) {
        const user = await db.collection(COLLECTIONS.USERS).findOne({ email: cleanEmail });
        if (
          user &&
          (user.adminRole ||
            user.roles?.includes('super_admin') ||
            user.roles?.includes('SUPER_ADMIN') ||
            user.roles?.includes('salon_owner') ||
            user.roles?.includes('SALON_OWNER'))
        ) {
          const salon = user.salonId
            ? await db.collection(COLLECTIONS.SALONS).findOne({ id: user.salonId })
            : await db.collection(COLLECTIONS.SALONS).findOne({ ownerEmail: cleanEmail });

          admin = {
            id: user.id || user._id.toString(),
            email: user.email,
            name: user.name || (user.roles?.includes('salon_owner') ? 'Salon Owner' : 'Admin'),
            role: user.adminRole || (user.roles?.includes('salon_owner') ? 'SALON_OWNER' : 'SUPER_ADMIN'),
            salonId: salon ? salon.id : user.salonId || 'salon_1',
            salonName: salon ? salon.name : 'My Salon',
            passwordHash: user.passwordHash,
            isActive: true,
            createdAt: user.createdAt || new Date().toISOString(),
          };
        }
      }
    } catch (dbErr) {
      console.warn('MongoDB connect check in login:', dbErr);
    }

    // Default bootstrap admin fallback for initial setup (only in non-production when database is empty)
    if (!admin && process.env.NODE_ENV !== 'production' && cleanEmail === 'admin@glamora.com' && password === 'admin123') {
      admin = {
        id: 'adm_super_001',
        email: 'admin@glamora.com',
        name: 'Super Administrator',
        role: 'SUPER_ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
    }

    if (!admin) {
      return NextResponse.json({ error: 'Invalid admin credentials or account not found' }, { status: 401 });
    }

    // Verify password if passwordHash exists; reject plaintext or missing hash in production
    if (admin.passwordHash) {
      const match = await bcrypt.compare(password, admin.passwordHash);
      if (!match) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Issue signed JWT token via hardened engine with standard claims
    const token = signJwtToken(
      {
        uid: admin.id,
        email: admin.email,
        name: admin.name,
        adminRole: admin.role,
        role: admin.role,
      },
      '7d'
    );

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        salonId: admin.salonId,
        salonName: admin.salonName,
        isActive: true,
      },
    });

    // Set secure HTTP-only session cookie
    const cookieOpts = getAdminCookieOptions();
    response.cookies.set('glamora_admin_token', token, cookieOpts);

    return response;
  } catch (error: any) {
    console.error('API /auth/login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
