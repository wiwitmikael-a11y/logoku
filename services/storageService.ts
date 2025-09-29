import { supabase } from './supabaseClient';
import { compressAndConvertToWebP } from '../utils/imageUtils';
import type { Project, ProjectData } from '../types';

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
    if (!userId) {
        throw new Error('Upload gagal: User ID tidak valid atau tidak ditemukan. Pengguna harus login untuk mengunggah file.');
    }
    
    const BUCKET_NAME = 'project-assets';

    const compressedBase64 = await compressAndConvertToWebP(base64String);
    const blob = await base64ToBlob(compressedBase64);

    if (!blob) {
        throw new Error('Gagal mengubah data Base64 menjadi file. Data mungkin korup atau formatnya salah.');
    }

    if (blob.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Upload gagal: Ukuran file (${(blob.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal (5 MB).`);
    }
    
    const fileName = `${projectId}_${assetType}-${Date.now()}.webp`;
    // NEW: Menggunakan struktur folder per pengguna untuk RLS yang lebih kuat.
    const filePath = `${userId}/${fileName}`; 
    const file = new File([blob], fileName, { type: 'image/webp' });

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        // NEW: Pesan error yang lebih deskriptif untuk membantu developer.
        throw new Error(`Gagal upload ke Supabase Storage: ${uploadError.message}. Pastikan RLS Policy di bucket 'project-assets' mengizinkan pengguna untuk INSERT ke dalam folder mereka sendiri (contoh: (storage.foldername(name))[1] = auth.uid()::text).`);
    }

    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
    }

    return publicUrlData.publicUrl;
};

/**
 * Checks if a string is a Base64 data URL.
 */
const isBase64DataUrl = (str: string | undefined): str is string => {
    return typeof str === 'string' && str.startsWith('data:image');
}

/**
 * Takes a project with base64 assets, uploads them all to Supabase Storage,
 * and returns a new ProjectData object with public URLs.
 */
export const uploadAndSyncProjectAssets = async (project: Project): Promise<ProjectData> => {
    const { id: projectId, user_id: userId, project_data } = project;
    
    const newData: ProjectData = JSON.parse(JSON.stringify(project_data));
    const uploadTasks: Promise<void>[] = [];

    const createUploadTask = (
        data: string,
        assetType: string,
        updateFn: (url: string) => void
    ) => {
        uploadTasks.push(
            uploadImageFromBase64(data, userId, projectId, assetType).then(updateFn)
        );
    };

    if (isBase64DataUrl(newData.selectedLogoUrl)) {
        createUploadTask(newData.selectedLogoUrl, 'logo-main', url => { newData.selectedLogoUrl = url; });
    }

    if (newData.logoVariations) {
        for (const key of Object.keys(newData.logoVariations) as Array<keyof typeof newData.logoVariations>) {
            const variationData = newData.logoVariations[key];
            if (isBase64DataUrl(variationData)) {
                createUploadTask(variationData, `logo-variation-${key}`, url => {
                    if (newData.logoVariations) newData.logoVariations[key] = url;
                });
            }
        }
    }
    
    if (newData.socialMediaKit) {
        if (isBase64DataUrl(newData.socialMediaKit.profilePictureUrl)) {
             createUploadTask(newData.socialMediaKit.profilePictureUrl, 'social-profile-pic', url => {
                if (newData.socialMediaKit) newData.socialMediaKit.profilePictureUrl = url;
            });
        }
        if (isBase64DataUrl(newData.socialMediaKit.bannerUrl)) {
             createUploadTask(newData.socialMediaKit.bannerUrl, 'social-banner', url => {
                if (newData.socialMediaKit) newData.socialMediaKit.bannerUrl = url;
            });
        }
    }

    if (isBase64DataUrl(newData.selectedPackagingUrl)) {
         createUploadTask(newData.selectedPackagingUrl, 'packaging', url => { newData.selectedPackagingUrl = url; });
    }

    if (newData.printMediaAssets) {
        if (isBase64DataUrl(newData.printMediaAssets.businessCardUrl)) {
             createUploadTask(newData.printMediaAssets.businessCardUrl, 'print-business-card', url => {
                if (newData.printMediaAssets) newData.printMediaAssets.businessCardUrl = url;
            });
        }
         if (isBase64DataUrl(newData.printMediaAssets.bannerUrl)) {
             createUploadTask(newData.printMediaAssets.bannerUrl, 'print-banner', url => {
                if (newData.printMediaAssets) newData.printMediaAssets.bannerUrl = url;
            });
        }
         if (isBase64DataUrl(newData.printMediaAssets.rollBannerUrl)) {
             createUploadTask(newData.printMediaAssets.rollBannerUrl, 'print-roll-banner', url => {
                if (newData.printMediaAssets) newData.printMediaAssets.rollBannerUrl = url;
            });
        }
    }

    if (newData.contentCalendar) {
        newData.contentCalendar.forEach((entry, index) => {
            if (isBase64DataUrl(entry.imageUrl)) {
                createUploadTask(entry.imageUrl, `content-image-${index}`, url => {
                   if (newData.contentCalendar) newData.contentCalendar[index].imageUrl = url;
                });
            }
        });
    }

    await Promise.all(uploadTasks);

    return newData;
};