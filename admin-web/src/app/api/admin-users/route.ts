import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth-guard';
import { logAdminAction } from '@/lib/audit-logger';
import { getMongoAdminUsers, insertMongoAdminUser } from '@/lib/mongodb-service';
import { INITIAL_ADMIN_USERS } from '@/lib/mock-data';
import { AdminRole, AdminUser } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authCheck = await verifyAdminRequest(req, ['SUPER_ADMIN']);
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  let admins: AdminUser[] = [];
  try {
    admins = await getMongoAdminUsers();
  } catch (err) {
    console.warn('MongoDB getMongoAdminUsers notice:', err);
  }

  if (admins.length === 0 && process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true') {
    admins = INITIAL_ADMIN_USERS;
  }

  return NextResponse.json({ success: true, admins });
}

export async function POST(req: NextRequest) {
  const authCheck = await verifyAdminRequest(req, ['SUPER_ADMIN']);
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const admin = authCheck.session!;
  const body = await req.json().catch(() => ({}));
  const { email, name, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required.' }, { status: 400 });
  }

  const newAdmin: AdminUser = {
    id: `adm_${Date.now()}`,
    email,
    name: name || email.split('@')[0],
    role: role as AdminRole,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await insertMongoAdminUser(newAdmin);
  } catch (err) {
    console.warn('MongoDB insertMongoAdminUser notice:', err);
  }

  // Keep in-memory sync for testing
  INITIAL_ADMIN_USERS.push(newAdmin);

  await logAdminAction({
    adminId: admin.uid,
    adminEmail: admin.email,
    adminRole: admin.role,
    action: 'ADMIN_ROLE_ASSIGN',
    targetCollection: 'admin_users',
    targetId: newAdmin.id,
    newValue: { role },
    reason: `Assigned role ${role} to ${email}`,
    result: 'SUCCESS',
  });

  return NextResponse.json({ success: true, admin: newAdmin });
}
