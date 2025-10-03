// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

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

/**
 * Checks if a string is a Base64 data URL.
 */
export const isBase64DataUrl = (str: string | undefined): str is string => {
    return typeof str === 'string' && str.startsWith('data:image');
};


/**
 * Applies a text watermark to a Base64 image using Canvas.
 * It intelligently chooses between black or white text for readability.
 * @param base64Image The source image as a Base64 data URL.
 * @returns A promise that resolves with the watermarked image as a Base64 data URL.
 */
export const applyWatermark = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            // Watermark style
            const watermarkText = 'desain.fun by @rangga.p.h';
            const padding = Math.max(10, canvas.width * 0.015);
            const fontSize = Math.max(12, Math.min(canvas.width / 60, 24));
            
            ctx.font = `500 ${fontSize}px "Plus Jakarta Sans"`;
            ctx.globalAlpha = 0.7;

            // Check brightness of corner to decide font color
            // Check a small area in the bottom-right corner for average brightness.
            const sampleWidth = Math.min(200, canvas.width * 0.2);
            const sampleHeight = Math.min(50, canvas.height * 0.1);
            const sampleX = canvas.width - sampleWidth - padding;
            const sampleY = canvas.height - sampleHeight - padding;

            const pixelData = ctx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight).data;
            let totalBrightness = 0;
            for (let i = 0; i < pixelData.length; i += 4) {
                // Using the luminance formula
                totalBrightness += (pixelData[i] * 0.299 + pixelData[i + 1] * 0.587 + pixelData[i + 2] * 0.114);
            }
            const avgBrightness = totalBrightness / (pixelData.length / 4);
            
            // Set text color based on brightness
            const textColor = avgBrightness > 128 ? '#000000' : '#FFFFFF';
            const shadowColor = avgBrightness > 128 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
            
            ctx.fillStyle = textColor;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            
            // Add a subtle shadow for better readability on complex backgrounds
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);

            resolve(canvas.toDataURL());
        };
        img.onerror = () => reject(new Error('Failed to load image for watermarking.'));
    });
};
