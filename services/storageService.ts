import { supabase } from './supabaseClient';
import { compressAndConvertToWebP } from '../utils/imageUtils';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit

const base64ToBlob = async (base64: string): Promise<Blob | null> => {
    try {
        const response = await fetch(base64);
        return await response.blob();
    } catch (e) {
        console.error("Gagal mengonversi data URL Base64 ke Blob:", e);
        return null;
    }
};

/**
 * Compresses, converts, and uploads an image from a Base64 string to Supabase Storage.
 * This is the core of the hybrid storage strategy.
 * @param base64String The full data URL of the image ("data:image/png;base64,...").
 * @param userId The ID of the user uploading the file.
 * @param projectId The ID of the project for this asset.
 * @param assetType A descriptive string for the asset (e.g., 'logo', 'flyer').
 * @returns The public URL of the uploaded file.
 */
export const uploadImageFromBase64 = async (
    base64String: string,
    userId: string,
    projectId: number,
    assetType: string
): Promise<string> => {
    const BUCKET_NAME = 'project-assets';

    // Step 1: Compress and convert the image to a WebP Blob.
    const compressedBase64 = await compressAndConvertToWebP(base64String);
    const blob = await base64ToBlob(compressedBase64);

    if (!blob) {
        throw new Error('Gagal mengubah data Base64 menjadi file.');
    }

    // Step 2: Validate file size on the client side.
    if (blob.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Upload gagal: Ukuran file (${(blob.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal (5 MB).`);
    }
    
    // Step 3: Create a standard `File` object for uploading.
    const fileName = `${assetType}-${Date.now()}.webp`;
    const filePath = `${userId}/${projectId}/${fileName}`;
    const file = new File([blob], fileName, { type: 'image/webp' });

    // Step 4: Upload the file.
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600', // Cache for 1 hour
            upsert: false,
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        throw new Error(`Gagal upload ke Supabase Storage: ${uploadError.message}.`);
    }

    // Step 5: Get the public URL.
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
    }

    return publicUrlData.publicUrl;
};