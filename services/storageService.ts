import { supabase } from './supabaseClient';
import { compressAndConvertToWebP, isBase64DataUrl } from '../utils/imageUtils';
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
    
    // Sanitize the user ID by removing hyphens to prevent potential issues with Supabase RLS functions.
    const sanitizedUserId = userId.replace(/-/g, '');
    const fileName = `${projectId}_${assetType}-${Date.now()}.webp`;
    const filePath = `${sanitizedUserId}/${fileName}`; 
    const file = new File([blob], fileName, { type: 'image/webp' });

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        throw new Error(`Gagal upload ke Supabase Storage: ${uploadError.message}. Pastikan RLS Policy di bucket 'project-assets' mengizinkan pengguna untuk INSERT. Coba policy ini: "(storage.foldername(name))[1] = replace(auth.uid()::text, '-', '')"`);
    }

    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
    }

    return publicUrlData.publicUrl;
};


export type ProgressStatus = 'pending' | 'uploading' | 'complete' | 'error';
export interface ProgressUpdate {
  assetKey: string;
  assetName: string;
  status: ProgressStatus;
  message?: string;
}
export type ProgressCallback = (update: ProgressUpdate) => void;

/**
 * Takes a project with base64 assets, uploads them all to Supabase Storage,
 * and returns a new ProjectData object with public URLs.
 */
export const uploadAndSyncProjectAssets = async (project: Project, onProgress: ProgressCallback): Promise<ProjectData> => {
    const { id: projectId, user_id: userId, project_data } = project;
    
    const newData: ProjectData = JSON.parse(JSON.stringify(project_data));
    
    const assetsToUpload: {
        key: string;
        name: string;
        data: string | undefined;
        updateFn: (url: string) => void;
    }[] = [];
    
    const addAsset = (key: string, name: string, data: string | undefined, updateFn: (url: string) => void) => {
        if (isBase64DataUrl(data)) {
            assetsToUpload.push({ key, name, data, updateFn });
        }
    };
    
    addAsset('logo-main', 'Logo Utama', newData.selectedLogoUrl, url => { newData.selectedLogoUrl = url; });
    if (newData.logoVariations) {
        addAsset('logo-variation-stacked', 'Logo Tumpuk', newData.logoVariations.stacked, url => { if(newData.logoVariations) newData.logoVariations.stacked = url; });
        addAsset('logo-variation-horizontal', 'Logo Datar', newData.logoVariations.horizontal, url => { if(newData.logoVariations) newData.logoVariations.horizontal = url; });
        addAsset('logo-variation-monochrome', 'Logo Monokrom', newData.logoVariations.monochrome, url => { if(newData.logoVariations) newData.logoVariations.monochrome = url; });
    }
    if (newData.socialMediaKit) {
        addAsset('social-profile-pic', 'Foto Profil Sosmed', newData.socialMediaKit.profilePictureUrl, url => { if(newData.socialMediaKit) newData.socialMediaKit.profilePictureUrl = url; });
        addAsset('social-banner', 'Banner Sosmed', newData.socialMediaKit.bannerUrl, url => { if(newData.socialMediaKit) newData.socialMediaKit.bannerUrl = url; });
    }
    addAsset('packaging', 'Desain Kemasan', newData.selectedPackagingUrl, url => { newData.selectedPackagingUrl = url; });
    if (newData.printMediaAssets) {
        addAsset('print-banner', 'Spanduk', newData.printMediaAssets.bannerUrl, url => { if(newData.printMediaAssets) newData.printMediaAssets.bannerUrl = url; });
        addAsset('print-roll-banner', 'Roll Banner', newData.printMediaAssets.rollBannerUrl, url => { if(newData.printMediaAssets) newData.printMediaAssets.rollBannerUrl = url; });
    }
    newData.contentCalendar?.forEach((entry, index) => {
        addAsset(`content-image-${index}`, `Visual Konten Hari Ke-${index + 1}`, entry.imageUrl, url => { if(newData.contentCalendar) newData.contentCalendar[index].imageUrl = url; });
    });


    for (const asset of assetsToUpload) {
        try {
            onProgress({ assetKey: asset.key, assetName: asset.name, status: 'uploading', message: 'Mempersiapkan & mengunggah...' });
            const uploadedUrl = await uploadImageFromBase64(asset.data!, userId, projectId, asset.key);
            asset.updateFn(uploadedUrl);
            onProgress({ assetKey: asset.key, assetName: asset.name, status: 'complete', message: 'Berhasil!' });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onProgress({ assetKey: asset.key, assetName: asset.name, status: 'error', message });
            throw new Error(`Gagal mengunggah ${asset.name}: ${message}`);
        }
    }

    return newData;
};