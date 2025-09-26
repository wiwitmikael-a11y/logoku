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
 * [ROMBAK TOTAL] Mengunggah gambar dari string Base64 ke Supabase Storage.
 * Versi baru ini mencakup pengecekan ukuran file di SISI KLIEN sebelum upload.
 * Ini mencegah percobaan upload yang tidak perlu dan memberikan penanganan error yang lebih jelas
 * untuk masalah miskonfigurasi RLS Policy yang diketahui.
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

    // Langkah 2: [BARU] Validasi ukuran file di sisi klien.
    if (blob.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Upload gagal: Ukuran file (${(blob.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal (5 MB).`);
    }
    
    // Langkah 3: Buat objek File dari Blob.
    const fileName = `${assetType}-${Date.now()}.webp`;
    const file = new File([blob], fileName, { type: 'image/webp' });
    const filePath = `${userId}/${projectId}/${fileName}`;

    // Langkah 4: Upload File.
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp', 
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        const errorString = (uploadError instanceof Error ? uploadError.message : JSON.stringify(uploadError)).toLowerCase();

        // [Pesan Error Baru] Pesan error paling lugas, non-teknis, dan anti-bantah.
        // Mengkonfirmasi masalah 100% ada di settingan dashboard Supabase, bukan di kode aplikasi.
        if (errorString.includes('function ceil(text) does not exist') || errorString.includes('policy')) {
            const rlsErrorMessage = "STOP! Upload Ditolak Satpam Supabase. Settingan RLS Policy di akun Supabase lo 100% salah. Ini BUKAN error di aplikasi. Mang AI nggak bisa benerin ini dari kode. Lo HARUS login ke Supabase dan benerin sendiri policy INSERT di bucket 'project-assets'.";
            throw new Error(rlsErrorMessage);
        }

        throw new Error(`Gagal upload ke Supabase Storage: ${uploadError.message}. Cek koneksi dan pastikan bucket 'project-assets' ada & publik.`);
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