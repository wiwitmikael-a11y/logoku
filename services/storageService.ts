import { supabase } from './supabaseClient';
import { compressAndConvertToWebP } from '../utils/imageUtils';

// Helper to convert a Base64 data URL to a Blob object.
const base64ToBlob = async (base64: string): Promise<Blob | null> => {
    try {
        const response = await fetch(base64);
        const blob = await response.blob();
        return blob;
    } catch (e) {
        console.error("Gagal mengonversi data URL Base64 ke Blob:", e);
        return null;
    }
};


/**
 * Compresses, converts, and uploads an image from a Base64 string to Supabase Storage.
 * Now includes a client-side compression step to save storage space.
 * It now uploads an ArrayBuffer directly to potentially avoid RLS issues with metadata types.
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

    // Step 1: Compress the image to WebP format.
    const compressedBase64 = await compressAndConvertToWebP(base64String);
    
    // Step 2: Convert the Base64 string to a Blob, then to an ArrayBuffer.
    const fileName = `${assetType}-${Date.now()}.webp`;
    const blob = await base64ToBlob(compressedBase64);

    if (!blob) {
        throw new Error('Gagal mengubah data Base64 menjadi file. Data mungkin korup atau formatnya salah.');
    }
    
    const arrayBuffer = await blob.arrayBuffer();
    const filePath = `${userId}/${projectId}/${fileName}`;

    // Step 3: Upload the ArrayBuffer.
    // We pass the ArrayBuffer directly. This might influence how the backend processes metadata,
    // potentially resolving type-related issues in RLS policies.
    // The 'contentType' must be specified when uploading an ArrayBuffer.
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, arrayBuffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp',
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        const errorString = (uploadError instanceof Error ? uploadError.message : JSON.stringify(uploadError)).toLowerCase();

        // Check for the specific RLS policy error. The message is now more direct.
        if (errorString.includes('function ceil(text) does not exist')) {
            const rlsErrorMessage = "FIX DI DASHBOARD SUPABASE: Upload gagal karena RLS Policy di bucket 'project-assets' salah. Buka Storage > Policies, edit policy untuk INSERT, dan ganti `ceil(NEW.metadata->>'size')` menjadi `(NEW.metadata->>'size')::bigint`. Error ini BUKAN dari kode aplikasi.";
            throw new Error(rlsErrorMessage);
        }

        if (errorString.includes('security policy') || errorString.includes('rls')) {
            const genericRlsError = "Koneksi ke storage diblokir sama RLS (Row Level Security) Policy. Ini 99% masalah konfigurasi di dashboard Supabase, bukan di kode aplikasi. Cek lagi semua policy (SELECT, INSERT, UPDATE, DELETE) di bucket `project-assets` lo.";
            throw new Error(genericRlsError);
        }

        throw new Error(`Gagal mengunggah gambar ke Supabase Storage: ${uploadError.message}. Pastikan bucket 'project-assets' sudah ada dan bersifat publik.`);
    }

    // Step 4: Get the public URL of the successfully uploaded file.
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
    }

    return publicUrlData.publicUrl;
};
