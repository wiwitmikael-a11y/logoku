
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { BrandInputs, BrandPersona, ContentCalendarEntry, LogoVariations, ProjectData, GeneratedCaption } from '../types';

// --- Environment Variable Setup ---
// The API key must be available as import.meta.env.VITE_API_KEY.
// Vercel requires a VITE_ prefix to expose environment variables to the browser.
const API_KEY = import.meta.env?.VITE_API_KEY;


// --- Gemini Client Setup ---
let ai: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI => {
    if (ai) return ai;
    if (!API_KEY) {
        throw new Error("Waduh, API Key Google Gemini (`VITE_API_KEY`) nggak ketemu, bro! Di Vercel, semua environment variable untuk frontend harus diawali 'VITE_'. Cek lagi settingan-mu ya.");
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
    return ai;
};

/**
 * A centralized error handler for all AI API calls.
 * @param error The original error caught from the API call.
 * @param serviceName The name of the service that failed.
 * @returns A new Error object with a user-friendly message.
 */
const handleApiError = (error: any, serviceName: string): Error => {
    console.error(`${serviceName} API Error:`, error);
    const errorString = (error instanceof Error ? error.message : JSON.stringify(error)).toLowerCase();

    if (errorString.includes('resource_exhausted') || errorString.includes('quota')) {
        return new Error(`Waduh, udud Mang AI habis euy. Jatah API ${serviceName} udah abis, coba lagi besok. Ini biasanya karena jatah gratisan udah mentok.`);
    }
    if (errorString.includes('prompt was blocked') || errorString.includes('safety')) {
        return new Error(`Request lo ke ${serviceName} diblokir karena isinya kurang aman. Coba ubah prompt atau input-nya ya.`);
    }
    if (errorString.includes('api key') || errorString.includes('authorization') || errorString.includes('api key not valid')) {
        return new Error(`Waduh, API Key buat ${serviceName} kayaknya salah atau nggak valid, bro. Cek lagi gih.`);
    }
    // Check for our custom API key missing error from getAiClient
    if (errorString.includes("nggak ketemu, bro!")) {
        return new Error((error as Error).message);
    }
    
    return new Error(`Gagal manggil ${serviceName}. Coba cek console buat detailnya.`);
};


// --- Persona & Slogan Generation (Gemini Text) ---
export const generateBrandPersona = async (
  businessName: string,
  industry: string,
  targetAudience: string,
  valueProposition: string
): Promise<BrandPersona[]> => {
  const ai = getAiClient();
  const brandVoiceSchema = { type: Type.OBJECT, properties: { deskripsi: { type: Type.STRING }, kata_yang_digunakan: { type: Type.ARRAY, items: { type: Type.STRING } }, kata_yang_dihindari: { type: Type.ARRAY, items: { type: Type.STRING } } } };
  const customerAvatarSchema = { type: Type.OBJECT, properties: { nama_avatar: { type: Type.STRING }, deskripsi_demografis: { type: Type.STRING }, pain_points: { type: Type.ARRAY, items: { type: Type.STRING } }, media_sosial: { type: Type.ARRAY, items: { type: Type.STRING } } } };
  const brandPersonaSchema = { type: Type.OBJECT, properties: { nama_persona: { type: Type.STRING }, deskripsi_singkat: { type: Type.STRING }, kata_kunci: { type: Type.ARRAY, items: { type: Type.STRING } }, palet_warna_hex: { type: Type.ARRAY, items: { type: Type.STRING } }, customer_avatars: { type: Type.ARRAY, items: customerAvatarSchema }, brand_voice: brandVoiceSchema } };
  const finalSchema = { type: Type.OBJECT, properties: { personas: { type: Type.ARRAY, description: "Array dari 3 alternatif persona brand yang komprehensif.", items: brandPersonaSchema } } };

  try {
    const userPrompt = `Kamu adalah seorang brand strategist ahli untuk UMKM Indonesia. Berdasarkan info ini:
- Nama Bisnis: "${businessName}"
- Industri: ${industry}
- Target Pelanggan: ${targetAudience}
- Nilai Jual: ${valueProposition}
Buatkan 3 alternatif persona brand yang komprehensif. Setiap persona harus mencakup semua field yang ada di schema JSON yang diminta. Pastikan palet warna adalah kode hex yang valid.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: { responseMimeType: "application/json", responseSchema: finalSchema }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result.personas;
  } catch (error) {
    throw handleApiError(error, "Google Gemini");
  }
};

export const generateSlogans = async (
    businessName: string,
    persona: BrandPersona,
    competitors: string
): Promise<string[]> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Buatkan 5 alternatif slogan/tagline untuk bisnis bernama "${businessName}" dengan persona brand "${persona.nama_persona}: ${persona.deskripsi_singkat}".
            Beberapa kompetitornya adalah: ${competitors}.
            Buat slogan yang menonjol dan berbeda dari kompetitor. Output harus berupa array JSON string.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw handleApiError(error, "Google Gemini");
    }
};

export const generateCaptions = async (
    businessName: string,
    persona: BrandPersona,
    topic: string,
    tone: string,
): Promise<GeneratedCaption[]> => {
    const ai = getAiClient();
    const schema = {
        type: Type.OBJECT,
        properties: {
            captions: {
                type: Type.ARRAY,
                description: "Array dari 3-5 alternatif caption sosial media.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        caption: {
                            type: Type.STRING,
                            description: "Teks caption yang menarik dan engaging."
                        },
                        hashtags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Array berisi 5-7 hashtag yang relevan."
                        }
                    },
                    required: ["caption", "hashtags"],
                }
            }
        }
    };
    try {
        const userPrompt = `Kamu adalah seorang social media manager profesional untuk UMKM Indonesia.
Brand: "${businessName}"
Persona Brand: "${persona.nama_persona} - ${persona.deskripsi_singkat}"
Gaya Bicara: Gunakan kata-kata seperti "${persona.brand_voice.kata_yang_digunakan.join(', ')}", hindari kata-kata seperti "${persona.brand_voice.kata_yang_dihindari.join(', ')}".
Tugas: Buatkan 3 alternatif caption sosial media (misal: untuk Instagram).
Topik Postingan: "${topic}"
Nada Bicara: "${tone}"
Setiap alternatif harus berisi caption yang menarik dan daftar hashtag yang relevan. Ikuti JSON schema yang diberikan.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result.captions;
    } catch (error) {
        throw handleApiError(error, "Google Gemini (Caption)");
    }
};


// --- NEW: Centralized Gemini Image Generation function ---
const generateImagesWithGemini = async (prompt: string, count: number): Promise<string[]> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: count,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        
        // More robust check: Ensure the response and the generatedImages array are valid.
        if (!response || !Array.isArray(response.generatedImages) || response.generatedImages.length === 0) {
             console.error("Invalid or empty response from Gemini Image API:", response);
            throw new Error("Waduh, respons dari Gemini Image kosong atau formatnya aneh. Ini bisa jadi karena prompt-nya terlalu rumit atau ada gangguan sementara. Coba lagi dengan prompt yang lebih simpel.");
        }

        // Filter for valid images and extract their data.
        const imageData = response.generatedImages
            .map(img => img.image?.imageBytes)
            .filter((bytes): bytes is string => !!bytes);

        if (imageData.length === 0) {
            console.error("No valid image data found in Gemini Image API response:", response);
            throw new Error("Mang AI berhasil manggil Gemini, tapi nggak ada data gambar yang valid di responsnya. Coba lagi dengan prompt yang beda ya.");
        }

        return imageData.map(bytes => `data:image/png;base64,${bytes}`);

    } catch (error) {
        // Re-throw our custom, more descriptive errors directly.
        if (error instanceof Error && (error.message.startsWith("Waduh, respons dari Gemini") || error.message.startsWith("Mang AI berhasil manggil Gemini"))) {
            throw error;
        }
        // Use the generic handler for all other errors.
        throw handleApiError(error, "Google Gemini (Image)");
    }
};


// --- REWRITTEN with Gemini ---
export const generateLogoOptions = async (prompt: string): Promise<string[]> => {
  return generateImagesWithGemini(prompt, 1);
};

// --- REWRITTEN with Gemini ---
export const generateLogoVariations = async (basePrompt: string): Promise<Omit<LogoVariations, 'main'>> => {
    try {
        const [iconResult, monochromeResult] = await Promise.all([
            generateImagesWithGemini(`${basePrompt}, simplified icon only, clean, centered`, 1),
            generateImagesWithGemini(`${basePrompt}, monochrome, black and white version`, 1)
        ]);
        if (!iconResult[0] || !monochromeResult[0]) {
            throw new Error("Gagal generate salah satu variasi logo.");
        }
        return { icon: iconResult[0], monochrome: monochromeResult[0] };
    } catch(error) {
        // The inner function already handles the API error, just re-throw it
        throw error;
    }
};

// --- Image Editing (Gemini Vision) ---
export const editLogo = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [{ inlineData: { data: base64ImageData, mimeType } }, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        
        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imagePart?.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        throw new Error("Mang AI tidak menghasilkan gambar editan.");
    } catch (error) {
        throw handleApiError(error, "Google Gemini (Image Edit)");
    }
};

// --- Content Calendar (Gemini with Google Search) ---
export const generateContentCalendar = async (
  businessName: string,
  persona: BrandPersona
): Promise<{ calendar: ContentCalendarEntry[], sources: any[] }> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Buatkan draf kalender konten Instagram untuk 1 minggu (Senin-Jumat) untuk bisnis "${businessName}" dengan persona brand "${persona.nama_persona}".
Gunakan Google Search untuk mencari tren atau topik relevan di Indonesia minggu ini yang sesuai dengan industri dan persona brand.
Untuk setiap hari, berikan: 'hari', 'tipe_konten', 'ide_konten' (berdasarkan tren jika ada), 'draf_caption', dan 'rekomendasi_hashtag' (array 5 hashtag).
PENTING: Format output HARUS berupa JSON object yang valid, tanpa markdown formatting. JSON object harus memiliki satu key "calendar" yang valuenya adalah array dari 5 objek harian.`,
      config: { tools: [{googleSearch: {}}] },
    });
    
    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const parsedJson = JSON.parse(jsonString);
    return { calendar: parsedJson.calendar, sources };
  } catch (error) {
    throw handleApiError(error, "Google Gemini (Search)");
  }
};

// --- NEW Social Media Post Image Generation ---
export const generateSocialMediaPostImage = async (
    contentIdea: string,
    brandKeywords: string[]
): Promise<string[]> => {
    // A prompt designed to create visually appealing images without text, focusing on the theme.
    const prompt = `Create a visually stunning, high-quality social media post graphic suitable for an Instagram feed, aspect ratio 1:1. The image should visually represent the following theme or idea: "${contentIdea}". The overall artistic style should be: ${brandKeywords.join(', ')}. IMPORTANT: The image must not contain any text, words, or letters. It should be a pure visual representation. Style: professional, commercial photography, vibrant, engaging, clean aesthetic.`;
    return generateImagesWithGemini(prompt, 1);
};

// --- REWRITTEN with Gemini & Refactored for Type Safety ---
export const generatePrintMedia = async (
    type: 'business_card' | 'flyer' | 'banner' | 'roll_banner',
    data: {
        brandInputs: BrandInputs;
        selectedPersona: BrandPersona;
        logoPrompt: string;
    }
): Promise<string[]> => {
    let prompt = '';
    const { brandInputs, selectedPersona, logoPrompt } = data;
    const style = selectedPersona.kata_kunci.join(', ');
    const colors = selectedPersona.palet_warna_hex.join(', ');

    if (type === 'business_card' && brandInputs.contactInfo) {
        const { name, title, phone, email, website } = brandInputs.contactInfo;
        prompt = `A professional business card design for "${brandInputs.businessName}". Style: ${style}, clean, modern, print-ready. Colors: ${colors}. Logo described as: "${logoPrompt}". The card must legibly display: Name: ${name}, Title: ${title}, Phone: ${phone}, Email: ${email}, Website: ${website}. Realistic mockup.`;
    } else if (type === 'flyer' && brandInputs.flyerContent) {
        const { headline, body, cta } = brandInputs.flyerContent;
        prompt = `A professional A5 flyer design for "${brandInputs.businessName}". Style: ${style}, eye-catching, easy to read. Colors: ${colors}. Logo described as: "${logoPrompt}". Text: Headline: "${headline}" (large), Body: "${body}", CTA: "${cta}" (stands out). Realistic mockup.`;
    } else if (type === 'banner' && brandInputs.bannerContent) {
        const { headline, subheadline } = brandInputs.bannerContent;
        prompt = `A professional horizontal banner (spanduk) design for "${brandInputs.businessName}", size 3x1 meters. Style: ${style}, highly visible from a distance. Colors: ${colors}. Logo described as: "${logoPrompt}" (large and clear). Text: Headline: "${headline}" (very large), Sub-headline: "${subheadline}". Realistic outdoor mockup.`;
    } else if (type === 'roll_banner' && brandInputs.rollBannerContent) {
        const { headline, body, contact } = brandInputs.rollBannerContent;
        prompt = `A professional vertical roll-up banner design for "${brandInputs.businessName}", size 85x200 cm. Style: ${style}, elegant, informative. Colors: ${colors}. Logo described as: "${logoPrompt}" (at the top). Content: Headline: "${headline}" (top), Body: "${body}" (bullet points), Contact: "${contact}" (bottom). Realistic standing mockup.`;
    } else {
        throw new Error("Informasi yang dibutuhkan untuk generate media cetak tidak lengkap.");
    }
    return generateImagesWithGemini(prompt, 1);
};

// --- REWRITTEN with Gemini ---
export const generatePackagingDesign = async (prompt: string): Promise<string[]> => {
  const fullPrompt = `2D packaging design mockup, printable concept for a product. ${prompt}, flat lay, product photography style, clean background, commercial look.`;
  return generateImagesWithGemini(fullPrompt, 1);
};

// --- REWRITTEN with Gemini ---
export const generateMerchandiseMockup = async (prompt: string): Promise<string[]> => {
  return generateImagesWithGemini(prompt, 1);
};
