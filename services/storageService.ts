import { supabase } from './supabaseClient';
import { compressAndConvertToWebP } from '../utils/imageUtils';

// Batas ukuran file maksimal yang diizinkan (5 MB)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Helper untuk konversi Base64 ke Blob
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
 * Mengunggah gambar dari string Base64 ke Supabase Storage.
 * Fungsi ini sekarang menjadi bagian dari proses finalisasi massal.
 * @param base64String URL data lengkap dari gambar (misal: "data:image/png;base64,...").
 * @param userId ID pengguna yang mengunggah file.
 * @param projectId ID proyek tempat aset ini berada.
 * @param assetType String yang mendeskripsikan aset (misal: 'logo', 'flyer').
 * @returns URL publik dari file yang berhasil diunggah.
 */
export const uploadImageFromBase64 = async (
    base64String: string,
    userId: string,
    projectId: number,
    assetType: string
): Promise<string> => {
    const BUCKET_NAME = 'project-assets';

    // Langkah 1: Kompres dan konversi gambar ke Blob WebP.
    const compressedBase64 = await compressAndConvertToWebP(base64String);
    const blob = await base64ToBlob(compressedBase64);

    if (!blob) {
        throw new Error('Gagal mengubah data Base64 menjadi file. Data mungkin korup atau formatnya salah.');
    }

    // Langkah 2: [GERBANG UTAMA] Validasi ukuran file 100% di sisi aplikasi.
    if (blob.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Upload gagal: Ukuran file (${(blob.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal (5 MB).`);
    }
    
    // Langkah 3: Buat objek `File` standar untuk diunggah.
    // WORKAROUND: Struktur path diubah untuk menghindari bug RLS di backend Supabase.
    // Daripada `userId/projectId/file.webp`, kita gunakan `userId/projectId_file.webp`.
    // Ini mencegah RLS mencoba memproses segmen path 'projectId' yang tampaknya memicu error.
    const fileName = `${projectId}_${assetType}-${Date.now()}.webp`;
    const filePath = `${userId}/${fileName}`;
    const file = new File([blob], fileName, { type: 'image/webp' });

    // Langkah 4: Upload file. RLS Policy di Supabase sudah disederhanakan.
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        // Error disederhanakan karena validasi size sudah di app. Error di sini kemungkinan besar karena RLS ownership atau masalah koneksi.
        throw new Error(`Gagal upload ke Supabase Storage: ${uploadError.message}. Pastikan RLS Policy untuk ownership sudah benar.`);
    }

    // Langkah 5: Dapatkan URL publik.
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
    }

    return publicUrlData.publicUrl;
};