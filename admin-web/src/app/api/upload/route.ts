import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { checkRateLimit, getClientIp, buildRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limiter';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    // 1. IP-level Rate Limiting: max 20 uploads per IP per minute
    const clientIp = getClientIp(req);
    const ipRateCheck = await checkRateLimit(clientIp, RATE_LIMITS.UPLOAD_IP);
    if (!ipRateCheck.allowed) {
      return buildRateLimitResponse(ipRateCheck);
    }

    const contentType = req.headers.get('content-type') || '';

    let base64Data = '';
    let folder = 'glamora/uploads';
    let userId = req.headers.get('x-user-id') || 'anonymous';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const customFolder = formData.get('folder') as string | null;
      const customUserId = formData.get('userId') as string | null;

      if (customFolder) folder = `glamora/${customFolder}`;
      if (customUserId) userId = customUserId;

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form-data' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size exceeds maximum 5MB limit.' }, { status: 400 });
      }

      const mime = file.type || 'image/jpeg';
      if (!ALLOWED_MIME_TYPES.includes(mime.toLowerCase())) {
        return NextResponse.json(
          { error: `Invalid file type "${mime}". Allowed types: JPEG, PNG, WebP.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64Data = `data:${mime};base64,${buffer.toString('base64')}`;
    } else {
      const body = await req.json().catch(() => ({}));
      if (!body.file) {
        return NextResponse.json({ error: 'No file data provided in request body' }, { status: 400 });
      }
      base64Data = body.file;
      if (body.folder) folder = `glamora/${body.folder}`;
      if (body.userId) userId = body.userId;
    }

    // 2. User-level Rate Limiting: max 30 uploads per user per minute (if user provided)
    if (userId !== 'anonymous') {
      const userRateCheck = await checkRateLimit(userId, RATE_LIMITS.UPLOAD_USER);
      if (!userRateCheck.allowed) {
        return buildRateLimitResponse(userRateCheck);
      }
    }

    const uploadRes = await uploadToCloudinary(base64Data, folder);

    return NextResponse.json({
      success: true,
      url: uploadRes.url,
      publicId: uploadRes.publicId,
    });
  } catch (error: any) {
    console.error('Cloudinary upload route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image to Cloudinary' },
      { status: 500 }
    );
  }
}
