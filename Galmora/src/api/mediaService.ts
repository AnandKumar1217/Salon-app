/**
 * Media Service - Cloudinary Image Picker & Upload Service
 * High-performance image picker and Cloudinary CDN storage
 */
import {
  pickImageFromGallery,
  capturePhotoFromCamera,
  uploadImageToCloudinary,
  PickMediaOptions,
} from './cloudinaryService';

export { pickImageFromGallery, capturePhotoFromCamera, uploadImageToCloudinary };
export type { PickMediaOptions };

export interface PickImageOptions extends PickMediaOptions {}

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Uploads a local image URI to Cloudinary and returns the permanent HTTPS download URL
 */
export async function uploadImageToStorage(
  localUri: string,
  folderOrPath: string = 'salons',
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (onProgress) onProgress(25);
  const folder = folderOrPath.includes('/') ? folderOrPath.split('/')[0] : folderOrPath;
  const url = await uploadImageToCloudinary(localUri, folder);
  if (onProgress) onProgress(100);
  return url;
}

/**
 * Delete an image (stubbed for Cloudinary client security; Cloudinary client deletes require signed destroy)
 */
export async function deleteImageFromStorage(publicIdOrUrl: string): Promise<void> {
  console.log('Notice: Client-side deletion handled via Cloudinary management console or backend:', publicIdOrUrl);
}
