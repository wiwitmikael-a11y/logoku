// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { getSupabaseClient } from './supabaseClient';
import { compressAndConvertToWebP } from '../utils/imageUtils';

/**
 * Converts a Base64 data URL to a Blob object.
 * @param base64 The Base64 data URL (e.g., "data:image/png;base64,...").
 * @returns A Blob object representing the data.
 */
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

/**
 * Uploads a Base64 encoded image to Supabase Storage.
 * It automatically compresses the image to WebP format for optimization.
 * @param base64 The original Base64 image data URL.
 * @param userId The ID of the user uploading the file, for organizing storage.
 * @returns The public URL of the uploaded image.
 */
export const uploadBase64Image = async (base64: string, userId: string): Promise<string> => {
  const supabase = getSupabaseClient();
  const fileName = `${Date.now()}.webp`;
  const filePath = `${userId}/${fileName}`;

  // Compress and convert before creating Blob for upload
  const compressedBase64 = await compressAndConvertToWebP(base64);
  const file = base64ToBlob(compressedBase64);

  const { data, error } = await supabase.storage
    .from('brand_assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/webp',
    });

  if (error) {
    throw new Error(`Gagal mengunggah gambar: ${error.message}`);
  }

  // Retrieve the public URL after successful upload
  const { data: { publicUrl } } = supabase.storage
    .from('brand_assets')
    .getPublicUrl(data.path);

  return publicUrl;
};


/**
 * Uploads a Base64 encoded audio file to Supabase Storage.
 * @param base64 The Base64 audio data.
 * @param userId The ID of the user.
 * @param mimeType The MIME type of the audio (e.g., 'audio/mpeg').
 * @returns The public URL of the uploaded audio.
 */
export const uploadBase64Audio = async (base64: string, userId: string, mimeType: string = 'audio/mpeg'): Promise<string> => {
    const supabase = getSupabaseClient();
    const fileExtension = mimeType.split('/')[1] || 'mp3';
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    const file = base64ToBlob(`data:${mimeType};base64,${base64}`);

    const { data, error } = await supabase.storage
        .from('brand_assets')
        .upload(filePath, file, {
            contentType: mimeType,
            upsert: false
        });

    if (error) {
        throw new Error(`Gagal mengunggah audio: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from('brand_assets')
        .getPublicUrl(data.path);
        
    return publicUrl;
};
