import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export interface CloudinaryUploadResponse {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * Uploads a base64 or remote/local file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  fileData: string,
  folder: string = 'glamora'
): Promise<CloudinaryUploadResponse> {
  const result = await cloudinary.uploader.upload(fileData, {
    folder,
    resource_type: 'auto',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Deletes an image from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (err) {
    console.warn('Notice: Cloudinary delete error:', err);
    return false;
  }
}

export default cloudinary;

