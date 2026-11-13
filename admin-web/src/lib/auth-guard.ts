import { NextRequest } from 'next/server';
import { AdminRole } from './types';
import { INITIAL_ADMIN_USERS } from './mock-data';
import { verifyJwtToken } from './jwt-security';

export interface AdminSession {
  uid: string;
  email: string;
  name: string;
  role: AdminRole;
}

export async function verifyAdminRequest(
  req: NextRequest,
  allowedRoles?: AdminRole[]
): Promise<{ success: boolean; session?: AdminSession; error?: string; status: number }> {
  const authHeader = req.headers.get('authorization') || '';
  const cookieToken = req.cookies.get('glamora_admin_token')?.value;
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

  const isMockFallback = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';

  // CSRF Protection for state-changing HTTP methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin && host) {
      const originHost = origin.replace(/^https?:\/\//, '').split(':')[0];
      const requestHost = host.split(':')[0];
      if (originHost !== requestHost && originHost !== 'localhost') {
        return { success: false, error: 'Forbidden: CSRF Origin Mismatch', status: 403 };
      }
    }
  }

  if (!token) {
    if (isMockFallback) {
      const defaultAdmin = INITIAL_ADMIN_USERS[0];
      return {
        success: true,
        session: {
          uid: defaultAdmin.id,
          email: defaultAdmin.email,
          name: defaultAdmin.name,
          role: defaultAdmin.role,
        },
        status: 200,
      };
    }
    return { success: false, error: 'Unauthorized: Missing Authentication Token', status: 401 };
  }

  // Handle mock tokens e.g. "mock_adm_super_1" ONLY in local mock fallback mode
  if (token.startsWith('mock_')) {
    if (!isMockFallback) {
      return { success: false, error: 'Unauthorized: Mock tokens are prohibited in production mode', status: 401 };
    }
    const adminUser = INITIAL_ADMIN_USERS.find(
      (u) => `mock_${u.id}` === token || u.role === token.replace('mock_', '')
    );
    if (!adminUser) {
      return { success: false, error: 'Invalid mock admin token', status: 401 };
    }
    if (allowedRoles && !allowedRoles.includes(adminUser.role)) {
      return {
        success: false,
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}]. Caller has role: ${adminUser.role}`,
        status: 403,
      };
    }
    return {
      success: true,
      session: {
        uid: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
      status: 200,
    };
  }

  // Authoritative JWT Verification via hardened engine
  try {
    const decoded = verifyJwtToken<any>(token);
    const role = (decoded.adminRole || decoded.role || (decoded.roles?.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' : null)) as AdminRole | null;

    if (!role) {
      return { success: false, error: 'Forbidden: User does not possess administrator role', status: 403 };
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
      return {
        success: false,
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}]. Caller has role: ${role}`,
        status: 403,
      };
    }

    return {
      success: true,
      session: {
        uid: decoded.uid || decoded.id || 'adm_user',
        email: decoded.email || 'admin@glamora.com',
        name: decoded.name || 'Admin',
        role,
      },
      status: 200,
    };
  } catch (err: any) {
    if (isMockFallback) {
      const defaultAdmin = INITIAL_ADMIN_USERS[0];
      return {
        success: true,
        session: {
          uid: defaultAdmin.id,
          email: defaultAdmin.email,
          name: defaultAdmin.name,
          role: defaultAdmin.role,
        },
        status: 200,
      };
    }
    return { success: false, error: `Authentication failed: ${err.message}`, status: 401 };
  }
}
