/**
 * GLAMORA CORS & ORIGIN GOVERNANCE MODULE
 * 
 * Strict environment-driven allowlist of approved production and local origins.
 * Eliminates wildcard (*) access; dynamically echoes allowed origin with Vary: Origin.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  // Local development environments
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:8081',
  // Production Glamora domains
  'https://glamora.com',
  'https://www.glamora.com',
  'https://admin.glamora.com',
  'https://book.glamora.com',
  // Staging Glamora domains
  'https://staging.glamora.com',
  'https://staging-admin.glamora.com',
  'https://staging-book.glamora.com',
  'https://salon-app-n7l2.onrender.com',
];

/**
 * Returns the active allowlist of origins from process.env or defaults
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins || !envOrigins.trim()) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const customOrigins = envOrigins
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // Always merge with local origins in development mode
  if (process.env.NODE_ENV !== 'production') {
    return Array.from(new Set([...customOrigins, ...DEFAULT_ALLOWED_ORIGINS]));
  }

  return customOrigins;
}

/**
 * Determines whether a given Origin header is authorized
 */
export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;

  const normalized = origin.trim().replace(/\/$/, '').toLowerCase();
  const allowed = getAllowedOrigins().map((o) => o.toLowerCase());

  return allowed.includes(normalized);
}

