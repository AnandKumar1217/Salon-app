import { NextRequest, NextResponse } from 'next/server';
import { isOriginAllowed } from './lib/cors';

export function proxy(req: NextRequest) {
  const origin = req.headers.get('origin');
  const method = req.method;

  // 1. Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    // If no Origin header was sent, allow basic preflight
    if (!origin) {
      return new NextResponse(null, { status: 204 });
    }

    // Check against explicit allowlist
    if (isOriginAllowed(origin)) {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, X-Api-Version'
      );
      response.headers.set('Access-Control-Max-Age', '86400');
      response.headers.set('Vary', 'Origin');
      return response;
    } else {
      // Strictly reject unapproved origins
      return new NextResponse(
        JSON.stringify({ error: 'CORS Forbidden: Origin not allowed by Glamora security policy' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Vary': 'Origin',
          },
        }
      );
    }
  }

  // 2. CSRF Defense for state-changing HTTP methods carrying cookie credentials
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const hasAdminCookie = Boolean(req.cookies.get('glamora_admin_token')?.value);
    if (hasAdminCookie && origin && !isOriginAllowed(origin)) {
      return NextResponse.json(
        { error: 'Forbidden: Untrusted cross-origin request rejected (CSRF Protection)' },
        { status: 403, headers: { 'Vary': 'Origin' } }
      );
    }
  }

  // 3. Process normal request
  const response = NextResponse.next();

  // Attach explicit origin headers only when origin is authorized
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, X-Api-Version'
    );
    response.headers.set('Vary', 'Origin');
  } else if (origin && !isOriginAllowed(origin)) {
    // Unapproved origins receive Vary: Origin but NO Access-Control-Allow-Origin
    response.headers.set('Vary', 'Origin');
  }

  return response;
}

export default proxy;
export const middleware = proxy;

export const config = {
  matcher: '/api/:path*',
};

