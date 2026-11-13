import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.success || !authResult.session) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status });
    }

    return NextResponse.json({
      admin: {
        id: authResult.session.uid,
        email: authResult.session.email,
        name: authResult.session.name,
        role: authResult.session.role,
        isActive: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

