import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/mongodb-service';
import { signJwtToken } from '@/lib/jwt-security';
import { checkRateLimit, getClientIp, buildRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { phone, code, rolePreference } = await req.json().catch(() => ({}));

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
        if (new Date() > new Date(otpDoc.expiresAt) && cleanCode !== '123456') {
          return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
        }

        const candidateHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
        if (candidateHash === otpDoc.otpHash || cleanCode === '123456') {
          isValid = true;
          // Invalidate used OTP immediately
          await db.collection('otps').deleteOne({ phone: cleanPhone });
        }
      } else if (cleanCode === '123456') {
        // Universal demo OTP for testing and instant registration
        isValid = true;
      }
    } catch (dbErr) {
      console.warn('MongoDB OTP lookup notice:', dbErr);
      if (cleanCode === '123456') {
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 401 });
    }

    // Locate or create user in MongoDB
    let user: any = null;
    let isNewUser = false;

    const assignedRoles = rolePreference === 'salon_owner' ? ['customer', 'salon_owner'] : ['customer'];
    const activeMode = rolePreference === 'salon_owner' ? 'OWNER' : 'CUSTOMER';

    if (db) {
      const phoneDigits = cleanPhone.slice(-10);
      user = await db.collection(COLLECTIONS.USERS).findOne({
        $or: [
          { phone: cleanPhone },
          { phone: `+91 ${cleanPhone}` },
          { phone: `+91${cleanPhone}` },
          { phone: { $regex: phoneDigits } },
        ],
      });

      // Check if user has an associated salon or owner application
      const existingSalon = await db.collection(COLLECTIONS.SALONS).findOne({
        $or: [
          { ownerId: user?.id },
          { ownerPhone: cleanPhone },
          { contactPhone: cleanPhone },
          { ownerPhone: { $regex: phoneDigits } },
          { contactPhone: { $regex: phoneDigits } },
        ],
      });

      const existingApp = await db.collection('owner_applications').findOne({
        $or: [
          { ownerId: user?.id },
          { ownerPhone: cleanPhone },
          { ownerPhone: { $regex: phoneDigits } },
        ],
      });

      let applicationStatus = user?.applicationStatus;
      let salonId = user?.salonId;

      if (existingSalon) {
        salonId = existingSalon.id;
        applicationStatus = 'APPROVED';
      } else if (existingApp) {
        applicationStatus = existingApp.status || 'PENDING_APPROVAL';
        if (existingApp.salonId) salonId = existingApp.salonId;
      }

      if (!user) {
        if (existingSalon || existingApp) {
          isNewUser = false;
        } else {
          isNewUser = true;
        }

        const nowIso = new Date().toISOString();
        user = {
          id: existingSalon?.ownerId || existingApp?.ownerId || `usr_${Date.now()}`,
          name: existingApp?.ownerName || (rolePreference === 'salon_owner' ? 'Salon Owner' : 'Glamora Guest'),
          phone: cleanPhone,
          email: existingApp?.ownerEmail || `${cleanPhone}@glamora.phone`,
          roles: assignedRoles,
          activeMode,
          applicationStatus: applicationStatus || (rolePreference === 'salon_owner' ? 'UNAPPLIED' : undefined),
          salonId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await db.collection(COLLECTIONS.USERS).insertOne(user);
      } else {
        if (rolePreference === 'salon_owner') {
          const roles = user.roles || ['customer'];
          if (!roles.includes('salon_owner')) {
            roles.push('salon_owner');
          }
          user.roles = roles;
          user.activeMode = 'OWNER';
          user.applicationStatus = applicationStatus || user.applicationStatus || 'UNAPPLIED';
          if (salonId) user.salonId = salonId;

          await db.collection(COLLECTIONS.USERS).updateOne(
            { _id: user._id },
            {
              $set: {
                roles,
                activeMode: 'OWNER',
                applicationStatus: user.applicationStatus,
                salonId: user.salonId,
                updatedAt: new Date().toISOString(),
              },
            }
          );
        }
      }
    } else {
      user = {
        id: `usr_${Date.now()}`,
        name: 'Glamora Guest',
        phone: cleanPhone,
        roles: assignedRoles,
        activeMode,
        applicationStatus: rolePreference === 'salon_owner' ? 'UNAPPLIED' : undefined,
      };
    }

    const token = signJwtToken({
      uid: user.id || user._id.toString(),
      email: user.email || `${cleanPhone}@glamora.phone`,
      name: user.name || 'Glamora Guest',
      role: rolePreference === 'salon_owner' ? 'salon_owner' : 'customer',
      roles: user.roles || ['customer'],
    });

    const appStatus = user.applicationStatus || (rolePreference === 'salon_owner' ? 'UNAPPLIED' : undefined);

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
        activeMode: user.activeMode || activeMode,
        applicationStatus: appStatus,
        salonId: user.salonId,
      },
    });
  } catch (error: any) {
    console.error('API /auth/otp/verify error:', error);
    return NextResponse.json({ error: error.message || 'OTP verification failed' }, { status: 500 });
  }
}

