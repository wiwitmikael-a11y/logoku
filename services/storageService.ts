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
 * This version uploads a `File` object, which might be handled more robustly by Supabase's
 * metadata extraction for RLS policies compared to an ArrayBuffer.
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
    
    // Step 2: Convert the Base64 string to a Blob.
    const blob = await base64ToBlob(compressedBase64);

    if (!blob) {
        throw new Error('Gagal mengubah data Base64 menjadi file. Data mungkin korup atau formatnya salah.');
    }
    
    // Step 3: Create a File object from the Blob. This can provide better metadata for Supabase.
    const fileName = `${assetType}-${Date.now()}.webp`;
    const file = new File([blob], fileName, { type: 'image/webp' });
    const filePath = `${userId}/${projectId}/${fileName}`;

    // Step 4: Upload the File object.
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { // Using the File object directly
            cacheControl: '3600',
            upsert: false,
            // contentType is often inferred from the File object, but we specify it for safety
            contentType: 'image/webp', 
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        const errorString = (uploadError instanceof Error ? uploadError.message : JSON.stringify(uploadError)).toLowerCase();

        // The error message is now even more specific about the fix being in the Supabase Dashboard.
        if (errorString.includes('function ceil(text) does not exist')) {
            const rlsErrorMessage = "PERBAIKI DI DASHBOARD SUPABASE: Upload gagal karena RLS Policy untuk INSERT di bucket 'project-assets' salah. Buka dashboard Supabase > Storage > Policies. Edit policy INSERT Anda dan pastikan Anda menggunakan `(NEW.metadata->>'size')::bigint` untuk memeriksa ukuran file, BUKAN `ceil(...)`. Error ini TIDAK BISA diperbaiki dari kode aplikasi.";
            throw new Error(rlsErrorMessage);
        }

        if (errorString.includes('security policy') || errorString.includes('rls')) {
            const genericRlsError = "Koneksi ke storage diblokir sama RLS (Row Level Security) Policy. Ini 99% masalah konfigurasi di dashboard Supabase, bukan di kode aplikasi. Cek lagi semua policy (SELECT, INSERT, UPDATE, DELETE) di bucket `project-assets` lo.";
            throw new Error(genericRlsError);
        }

        throw new Error(`Gagal mengunggah gambar ke Supabase Storage: ${uploadError.message}. Pastikan bucket 'project-assets' sudah ada dan bersifat publik.`);
    }

    // Step 5: Get the public URL of the successfully uploaded file.
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
    }

    return publicUrlData.publicUrl;
};