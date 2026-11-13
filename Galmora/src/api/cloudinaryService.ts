import * as ImagePicker from 'expo-image-picker';

export interface CloudinaryUploadResult {
  url: string;
  publicId?: string;
  format?: string;
  bytes?: number;
}

export interface PickMediaOptions {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
}

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'glamora-cloud';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'glamora_unsigned';
const BACKEND_API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

/**
 * Pick an image from gallery
 */
export async function pickImageFromGallery(
  options: PickMediaOptions = {}
): Promise<{ uri: string; fileName: string } | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access photos was denied. Please enable it in device settings.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect ?? [16, 9],
    quality: options.quality ?? 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const fileName = asset.fileName || `media_${Date.now()}.jpg`;

  return { uri: asset.uri, fileName };
}

/**
 * Capture photo from camera
 */
export async function capturePhotoFromCamera(
  options: PickMediaOptions = {}
): Promise<{ uri: string; fileName: string } | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access camera was denied. Please enable it in device settings.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect ?? [1, 1],
    quality: options.quality ?? 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const fileName = asset.fileName || `cam_${Date.now()}.jpg`;

  return { uri: asset.uri, fileName };
}

/**
 * Uploads an image to Cloudinary (using Direct Cloudinary API or Backend /api/upload)
 */
export async function uploadImageToCloudinary(
  localUri: string,
  folder: string = 'salons'
): Promise<string> {
  const fileName = localUri.split('/').pop() || `upload_${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(fileName);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: fileName,
    type,
  } as any);

  // Method 1: Try direct Cloudinary API if cloud name configured
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_CLOUD_NAME !== 'glamora-cloud') {
    try {
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', `glamora/${folder}`);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        return json.secure_url;
      }
    } catch (directErr) {
      console.warn('Direct Cloudinary upload notice, trying backend API:', directErr);
    }
  }

  // Method 2: Upload via Backend Next.js API (/api/upload)
  try {
    const backendFormData = new FormData();
    backendFormData.append('file', {
      uri: localUri,
      name: fileName,
      type,
    } as any);
    backendFormData.append('folder', folder);

    const apiRes = await fetch(`${BACKEND_API_URL}/api/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return data.url;
    }
  } catch (backendErr) {
    console.warn('Backend Cloudinary upload notice:', backendErr);
  }

  // Fallback: return the local URI if offline / demo mode
  return localUri;
}

