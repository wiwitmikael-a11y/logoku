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
 * [PERBAIKAN] Mengunggah gambar dari string Base64 ke Supabase Storage.
 * Logika diubah untuk mengirim ArrayBuffer, bukan objek File, untuk menghindari potensi
 * masalah metadata di sisi server Supabase yang dapat menyebabkan error RLS Policy.
 * Pesan error untuk RLS Policy juga dibuat lebih instruktif.
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

    // Langkah 2: Validasi ukuran file di sisi klien.
    if (blob.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Upload gagal: Ukuran file (${(blob.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal (5 MB).`);
    }
    
    // Langkah 3: [BARU] Konversi Blob ke ArrayBuffer untuk di-upload.
    const arrayBuffer = await blob.arrayBuffer();
    const fileName = `${assetType}-${Date.now()}.webp`;
    const filePath = `${userId}/${projectId}/${fileName}`;

    // Langkah 4: Upload ArrayBuffer.
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, arrayBuffer, { // Menggunakan ArrayBuffer
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp', // Wajib disertakan saat upload ArrayBuffer
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        const errorString = (uploadError instanceof Error ? uploadError.message : JSON.stringify(uploadError)).toLowerCase();

        // [Pesan Error Baru] Pesan yang sangat spesifik dan instruktif untuk masalah RLS Policy.
        if (errorString.includes('function ceil(text) does not exist') || errorString.includes('policy')) {
            const rlsErrorMessage = "PERBAIKI DI DASHBOARD SUPABASE: Upload gagal karena RLS Policy untuk INSERT di bucket 'project-assets' salah. Buka dashboard Supabase > Storage > Policies. Edit policy INSERT Anda dan pastikan Anda menggunakan `(NEW.metadata->>'size')::bigint` untuk memeriksa ukuran file, BUKAN `ceil(...)`. Error ini TIDAK BISA diperbaiki dari kode aplikasi.";
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
