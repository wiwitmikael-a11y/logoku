/**
 * Fetches an image from a URL (e.g., from Supabase Storage) and converts it to a Base64 data URL.
 * This is necessary for sending image data back to the Gemini Vision API for editing.
 * @param imageUrl The public URL of the image to fetch.
 * @returns A promise that resolves with the Base64 data URL string.
 */
export const fetchImageAsBase64 = async (imageUrl: string): Promise<string> => {
    try {
        // Use a proxy or specific fetch settings if you encounter CORS issues in development.
        // For production on the same domain or with proper Supabase bucket policies, this should work.
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Gagal mengambil gambar: ${response.statusText} (status: ${response.status})`);
        }
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error("Gagal membaca file sebagai Base64."));
                }
            };
            reader.onerror = (error) => {
                reject(new Error(`FileReader error: ${error}`));
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching image as Base64:", error);
        // Re-throw the error so the calling component can handle it
        throw new Error(`Tidak dapat memuat gambar dari ${imageUrl} untuk diedit. Pastikan CORS policy di bucket Supabase sudah benar.`);
    }
};
