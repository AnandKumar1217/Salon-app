import { NextRequest, NextResponse } from 'next/server';
import { getMongoSalons, upsertMongoSalon } from '@/lib/mongodb-service';
import { Salon } from '@/lib/types';
import { verifyJwtToken } from '@/lib/jwt-security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.toLowerCase().trim();
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let salons = await getMongoSalons();

    if (query) {
      salons = salons.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query) ||
          s.city.toLowerCase().includes(query) ||
          s.categories?.some((c) => c.toLowerCase().includes(query))
      );
    }

    if (category && category !== 'All') {
      salons = salons.filter((s) => s.categories?.some((c) => c.toLowerCase() === category.toLowerCase()));
    }

    if (status) {
      salons = salons.filter((s) => s.status === status);
    }

    return NextResponse.json({ success: true, count: salons.length, salons });
  } catch (error: any) {
    console.error('API /salons GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch salons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize caller: must be an Admin or authorized Salon Owner
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get('glamora_admin_token')?.value;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication token is required' }, { status: 401 });
    }

    let caller: any = null;
    try {
      caller = verifyJwtToken<any>(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    const body: Salon = await req.json();
    if (!body.id || !body.name) {
      return NextResponse.json({ error: 'Missing required salon fields (id, name)' }, { status: 400 });
    }

    // Role-based check: Super Admin & Operations Admin can create/edit any salon.
    // Salon Owners can only edit their own salon (caller.uid === body.ownerId).
    const isAdmin =
      caller.adminRole === 'SUPER_ADMIN' ||
      caller.adminRole === 'OPERATIONS_ADMIN' ||
      caller.role === 'SUPER_ADMIN';
    const isOwner = caller.uid && body.ownerId && caller.uid === body.ownerId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this salon' },
        { status: 403 }
      );
    }

    await upsertMongoSalon(body);
    return NextResponse.json({ success: true, message: 'Salon saved in MongoDB', salon: body });
  } catch (error: any) {
    console.error('API /salons POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save salon' }, { status: 500 });
  }
}
