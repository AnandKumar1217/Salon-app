import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/mongodb-service';
import { verifyJwtToken } from '@/lib/jwt-security';
import { isExpoPushToken } from '@/lib/push-notifications';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get('glamora_admin_token')?.value;
    const jwtString = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    let authenticatedUserId: string | null = null;
    if (jwtString) {
      try {
        const decoded = verifyJwtToken(jwtString);
        authenticatedUserId = decoded.uid;
      } catch {
        // Token invalid or expired, continue to check body userId for guest mobile apps
      }
    }

    const body = await req.json().catch(() => ({}));
    const { pushToken, userId: bodyUserId, platform } = body;

    if (!pushToken || !isExpoPushToken(pushToken)) {
      return NextResponse.json(
        { error: 'Valid Expo Push Token is required (e.g. ExponentPushToken[...])' },
        { status: 400 }
      );
    }

    const targetUserId = authenticatedUserId || bodyUserId || 'guest_device';
    const db = await getDatabase();

    // 1. Upsert in dedicated push_tokens collection
    await db.collection('push_tokens').updateOne(
      { token: pushToken },
      {
        $set: {
          token: pushToken,
          userId: targetUserId,
          platform: platform || 'mobile',
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // 2. If targetUserId corresponds to a real registered user, associate token in users collection
    if (targetUserId && targetUserId !== 'guest_device') {
      await db.collection(COLLECTIONS.USERS).updateOne(
        { $or: [{ id: targetUserId }, { _id: (targetUserId as any) }] },
        {
          $addToSet: { pushTokens: pushToken } as any,
          $set: { pushToken, updatedAt: new Date().toISOString() },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Push notification token registered successfully',
      pushToken,
      userId: targetUserId,
    });
  } catch (error: any) {
    console.error('API /users/push-token POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register push token' },
      { status: 500 }
    );
  }
}

