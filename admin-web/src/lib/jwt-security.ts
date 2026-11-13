/**
 * Glamora JWT Security Engine
 * Enforces production-grade secret strength, standard claims, and cookie security.
 */
import jwt from 'jsonwebtoken';

const BLACKLISTED_SECRETS = [
  'glamora_jwt_secret_production_key_2026_xyz',
  'super_secret_jwt_key_at_least_32_characters_long',
  'super_secret_jwt_key_glamora_2026_xyz123456',
  '12345678901234567890123456789012',
  'secret',
  'password',
  'default_secret',
  'changeme',
  'admin',
  'test',
];

export const JWT_ISSUER = 'glamora-platform';
export const JWT_AUDIENCE = 'glamora-clients';

/**
 * Validates the JWT_SECRET environment variable.
 * Throws fatal error in production if missing, too short, or blacklisted.
 */
export function getAuthoritativeJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret) {
    if (isProd) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production.'
      );
    }
    // Strict non-production dev fallback
    return 'glamora_dev_jwt_secret_must_not_be_used_in_prod_32chars';
  }

  // Length check (minimum 32 characters for 256-bit entropy)
  if (secret.length < 32) {
    if (isProd) {
      throw new Error(
        `CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long. Provided secret has length ${secret.length}.`
      );
    }
  }

  // Blacklist check
  if (BLACKLISTED_SECRETS.includes(secret.toLowerCase().trim())) {
    if (isProd) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET matches a known default, placeholder, or weak secret. You must supply a unique, cryptographically random secret in production.'
      );
    }
  }

  return secret;
}

export interface GlamoraJwtPayload {
  uid: string;
  email: string;
  name: string;
  role: string;
  adminRole?: string;
  tokenVersion?: number;
  [key: string]: any;
}

/**
 * Signs a JWT with standard issuer, audience, and expiry claims
 */
export function signJwtToken(
  payload: Omit<GlamoraJwtPayload, 'iss' | 'aud' | 'iat'>,
  expiresIn: any = '7d'
): string {
  const secret = getAuthoritativeJwtSecret();
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn,
  });
}

/**
 * Verifies a JWT and checks standard issuer and audience claims
 */
export function verifyJwtToken<T = GlamoraJwtPayload>(token: string): T {
  const secret = getAuthoritativeJwtSecret();
  return jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as T;
}

/**
 * Returns hardened cookie security attributes
 */
export function getAdminCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  };
}
