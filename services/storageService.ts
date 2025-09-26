import { supabase } from './supabaseClient';
import { compressAndConvertToWebP } from '../utils/imageUtils';

// Helper to convert a Base64 data URL to a File object using the fetch API for robustness.
const base64ToFile = async (base64: string, filename: string): Promise<File | null> => {
    try {
        const response = await fetch(base64);
        const blob = await response.blob();
        // The blob.type will be correctly inferred from the data URL, e.g., 'image/webp'
        return new File([blob], filename, { type: blob.type });
    } catch (e) {
        console.error("Gagal mengonversi data URL Base64 ke File:", e);
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
    const file = await base64ToFile(compressedBase64, fileName);

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
        // Convert the entire error object to a string to ensure we can find the specific message.
        const errorString = (uploadError instanceof Error ? uploadError.message : JSON.stringify(uploadError)).toLowerCase();

        // Check for the specific RLS policy error first. This is a common misconfiguration.
        if (errorString.includes('function ceil(text) does not exist')) {
            const rlsErrorMessage = "Error RLS Policy: Terdeteksi error 'function ceil(text) does not exist'. Ini biasanya karena RLS policy untuk INSERT di bucket 'project-assets' salah mengkalkulasi ukuran file. Solusi: Buka dashboard Supabase > Storage > Policies > 'project-assets', edit policy INSERT-mu, dan pastikan kamu menggunakan `(NEW.metadata->>'size')::bigint <= MAX_FILE_SIZE_BYTES` untuk memeriksa ukuran file, bukan `ceil(NEW.metadata->'size')`.";
            throw new Error(rlsErrorMessage);
        }

        // Check for other generic RLS or security errors.
        if (errorString.includes('security policy') || errorString.includes('rls')) {
            const genericRlsError = "Koneksi ke storage diblokir sama RLS (Row Level Security) Policy. Ini 99% masalah konfigurasi di dashboard Supabase, bukan di kode aplikasi. Cek lagi semua policy (SELECT, INSERT, UPDATE, DELETE) di bucket `project-assets` lo.";
            throw new Error(genericRlsError);
        }

        // Fallback for other upload errors.
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
