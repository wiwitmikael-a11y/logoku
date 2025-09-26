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

/**
 * Compresses an image from a Base64 string and converts it to the WebP format.
 * This function is the core of the storage optimization strategy for the free tier.
 * @param base64String The original Base64 data URL (e.g., from Gemini API).
 * @param quality The desired quality for the output WebP image (0.0 to 1.0).
 * @returns A promise that resolves with the compressed Base64 data URL in WebP format.
 */
export const compressAndConvertToWebP = (base64String: string, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64String;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Gagal mendapatkan konteks canvas 2D.'));
            }
            ctx.drawImage(img, 0, 0);
            const webpDataUrl = canvas.toDataURL('image/webp', quality);
            resolve(webpDataUrl);
        };
        img.onerror = (error) => {
            console.error("Gagal memuat gambar dari Base64 ke elemen Image:", error);
            reject(new Error('Data Base64 sepertinya tidak valid.'));
        };
    });
};

/**
 * Creates a white canvas as a Base64 data URL.
 * This is used as a base for the image editing model to act like a generation model.
 * @param width The width of the canvas.
 * @param height The height of the canvas.
 * @returns A string representing the Base64 data URL of the white image.
 */
export const createWhiteCanvasBase64 = (width = 1024, height = 1024): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
    }
    return canvas.toDataURL('image/png'); // Using PNG as a safe default
};