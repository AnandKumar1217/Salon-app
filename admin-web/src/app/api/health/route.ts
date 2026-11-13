import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;

  try {
    const db = await getDatabase();
    const pingStart = Date.now();
    await db.command({ ping: 1 });
    dbLatencyMs = Date.now() - pingStart;
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  const jwtConfigured = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32);

  const isHealthy = dbStatus === 'connected' && cloudinaryConfigured && jwtConfigured;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          engine: 'MongoDB Atlas',
        },
        media: {
          status: cloudinaryConfigured ? 'configured' : 'missing_credentials',
          provider: 'Cloudinary',
        },
        auth: {
          status: jwtConfigured ? 'configured' : 'weak_or_missing_secret',
          algorithm: 'HS256',
        },
      },
      environment: process.env.NODE_ENV || 'development',
    },
    { status: isHealthy ? 200 : 503 }
  );
}

