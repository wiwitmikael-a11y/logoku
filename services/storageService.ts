import { supabase } from './supabaseClient';
import { compressAndConvertToWebP } from '../utils/imageUtils';

// Helper to convert a Base64 data URL to a File object
const base64ToFile = (base64: string, filename: string): File | null => {
    const match = base64.match(/data:(image\/(.+));base64,(.+)/);
    if (!match) return null;
    
    const mime = match[1];
    const b64 = match[3];

    try {
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        
        return new File([blob], filename, { type: mime });

    } catch (e) {
        console.error("Failed to decode Base64 string:", e);
        return null;
    }
};


/**
 * Compresses, converts, and uploads an image from a Base64 string to Supabase Storage.
 * Now includes a client-side compression step to save storage space.
 * @param base64String The full data URL of the image (e.g., "data:image/png;base64,...").
 * @param userId The ID of the user uploading the file.
 * @param projectId The ID of the project this asset belongs to.
 * @param assetType A string describing the asset (e.g., 'logo', 'flyer').
 * @returns The public URL of the uploaded file.
 */
export const uploadImageFromBase64 = async (
    base64String: string,
    userId: string,
    projectId: number,
    assetType: string
): Promise<string> => {
    const BUCKET_NAME = 'project-assets';

    // --- NEW: Smart Compression Step ---
    // Compress the original image and convert it to WebP before uploading.
    const compressedBase64 = await compressAndConvertToWebP(base64String);
    // ------------------------------------
    
    const fileName = `${assetType}-${Date.now()}.webp`; // Always use .webp extension now
    const file = base64ToFile(compressedBase64, fileName);

    if (!file) {
        throw new Error('Gagal mengubah data Base64 menjadi file. Data mungkin korup atau formatnya salah.');
    }
    
    const filePath = `${userId}/${projectId}/${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600', // Cache for 1 hour
            upsert: false, // Don't overwrite existing files
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        throw new Error(`Gagal mengunggah gambar ke Supabase Storage: ${uploadError.message}. Pastikan bucket 'project-assets' sudah ada dan bersifat publik.`);
    }

    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
    }

    return publicUrlData.publicUrl;
};