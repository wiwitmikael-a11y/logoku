import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { BrandInputs, BrandPersona, ContentCalendarEntry, LogoVariations, ProjectData, GeneratedCaption, SeoData, AdsData } from '../types';

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

// --- NEW: Robust JSON Parsing Helper ---
/**
 * Safely parses a JSON string, providing a more specific error message on failure.
 * @param jsonString The raw string from the AI model.
 * @param serviceName The name of the function/service for error logging.
 * @returns The parsed object of type T.
 * @throws An error if parsing fails.
 */
const safeJsonParse = <T>(jsonString: string, serviceName: string): T => {
  try {
    // Attempt to parse the JSON string.
    return JSON.parse(jsonString);
  } catch (parseError) {
    // Log the detailed error and the problematic string for debugging.
    console.error(`JSON Parse Error in ${serviceName}:`, parseError, "Raw string received:", jsonString);
    // Throw a user-friendly error.
    throw new Error(`Waduh, Mang AI lagi ngelindur. Respon dari ${serviceName} formatnya aneh dan nggak bisa dibaca. Coba generate ulang, ya.`);
  }
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
        config: { 
            responseMimeType: "application/json", 
            responseSchema: finalSchema,
            thinkingConfig: { thinkingBudget: 0 } 
        }
    });

    const jsonString = response.text.trim();
    const result = safeJsonParse<{ personas: BrandPersona[] }>(jsonString, "Brand Persona");
    if (!result || !Array.isArray(result.personas)) {
        throw new Error("Struktur data Persona yang diterima dari AI tidak sesuai harapan.");
    }
    return result.personas;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('ngelindur') || error.message.includes('tidak sesuai'))) {
        throw error;
    }
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
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const jsonString = response.text.trim();
        const result = safeJsonParse<string[]>(jsonString, "Slogan");
        if (!Array.isArray(result)) {
            throw new Error("Struktur data Slogan yang diterima dari AI tidak sesuai harapan (seharusnya array of strings).");
        }
        return result;
    } catch (error) {
        if (error instanceof Error && (error.message.includes('ngelindur') || error.message.includes('tidak sesuai'))) {
            throw error;
        }
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
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const jsonString = response.text.trim();
        const result = safeJsonParse<{ captions: GeneratedCaption[] }>(jsonString, "Caption");
        if (!result || !Array.isArray(result.captions)) {
            throw new Error("Struktur data Caption yang diterima dari AI tidak sesuai harapan.");
        }
        return result.captions;
    } catch (error) {
        if (error instanceof Error && (error.message.includes('ngelindur') || error.message.includes('tidak sesuai'))) {
            throw error;
        }
        throw handleApiError(error, "Google Gemini (Caption)");
    }
};


// --- Centralized Image Generation (using gemini-2.5-flash-image-preview) ---
const generateImagesWithFlash = async (prompt: string, count: number = 1): Promise<string[]> => {
    const ai = getAiClient();
    try {
        // Since the model doesn't support generating multiple images in one call,
        // we have to loop and call it multiple times if count > 1.
        const promises = Array(count).fill(0).map(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });

            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }
            // If no image is returned, throw an error for this specific promise.
            throw new Error("Waduh, Mang AI tidak menghasilkan gambar. Ini bisa jadi karena prompt-nya terlalu rumit atau ada gangguan sementara. Coba lagi dengan prompt yang lebih simpel.");
        });

        const imageData = await Promise.all(promises);
        return imageData;

    } catch (error) {
        // Re-throw our custom, more descriptive errors directly.
        if (error instanceof Error && error.message.startsWith("Waduh, Mang AI tidak menghasilkan gambar")) {
            throw error;
        }
        // Use the generic handler for all other errors.
        throw handleApiError(error, "Google Gemini Vision");
    }
};


export const generateLogoOptions = async (prompt: string): Promise<string[]> => {
  return generateImagesWithFlash(prompt, 1);
};

export const generateLogoVariations = async (basePrompt: string): Promise<Omit<LogoVariations, 'main'>> => {
    try {
        const [iconResult, monochromeResult] = await Promise.all([
            generateImagesWithFlash(`${basePrompt}, simplified icon only, clean, centered`, 1),
            generateImagesWithFlash(`${basePrompt}, monochrome, black and white version`, 1)
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
      config: { 
          tools: [{googleSearch: {}}],
          thinkingConfig: { thinkingBudget: 0 }
      },
    });
    
    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const parsedJson = safeJsonParse<{ calendar: ContentCalendarEntry[] }>(jsonString, "Content Calendar");
    if (!parsedJson || !Array.isArray(parsedJson.calendar)) {
        throw new Error("Struktur data Kalender Konten yang diterima dari AI tidak sesuai harapan.");
    }
    return { calendar: parsedJson.calendar, sources };
  } catch (error) {
    if (error instanceof Error && (error.message.includes('ngelindur') || error.message.includes('tidak sesuai'))) {
        throw error;
    }
    throw handleApiError(error, "Google Gemini (Search)");
  }
};

// --- SEO Content Generation ---
export const generateSeoContent = async (
  brandInputs: BrandInputs
): Promise<SeoData> => {
  const ai = getAiClient();
  const schema = {
    type: Type.OBJECT,
    properties: {
      keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "5-10 kata kunci relevan (short & long-tail) dalam Bahasa Indonesia."
      },
      metaTitle: {
        type: Type.STRING,
        description: "Judul meta SEO yang menarik, di bawah 60 karakter."
      },
      metaDescription: {
        type: Type.STRING,
        description: "Deskripsi meta SEO yang informatif, di bawah 160 karakter."
      },
      gmbDescription: {
        type: Type.STRING,
        description: "Deskripsi Google Business Profile yang engaging, maksimal 750 karakter."
      }
    },
    required: ["keywords", "metaTitle", "metaDescription", "gmbDescription"]
  };
  
  try {
    const prompt = `Kamu adalah seorang spesialis SEO untuk UMKM di Indonesia. Berdasarkan informasi bisnis ini:
- Nama Bisnis: "${brandInputs.businessName}"
- Industri: "${brandInputs.industry}"
- Target Pelanggan: "${brandInputs.targetAudience}"
- Nilai Jual Unik: "${brandInputs.valueProposition}"
Tugas: Buatkan paket optimasi Google (SEO) dasar.
1.  **Keywords**: Berikan 5-10 kata kunci yang paling relevan, campur antara short-tail dan long-tail.
2.  **Meta Title**: Buat judul SEO untuk halaman utama website, harus menarik dan di bawah 60 karakter.
3.  **Meta Description**: Buat deskripsi SEO yang persuasif, di bawah 160 karakter.
4.  **Google Business Profile Description**: Buat deskripsi profil bisnis untuk Google Maps yang informatif dan menarik, maksimal 750 karakter.
Pastikan semua output dalam Bahasa Indonesia dan sesuai dengan JSON schema yang diberikan.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    const jsonString = response.text.trim();
    const result = safeJsonParse<SeoData>(jsonString, "SEO Content");
    if (!result || typeof result.keywords === 'undefined' || typeof result.metaTitle === 'undefined') {
        throw new Error("Struktur data SEO yang diterima dari AI tidak sesuai harapan.");
    }
    return result;
  } catch(error) {
    if (error instanceof Error && (error.message.includes('ngelindur') || error.message.includes('tidak sesuai'))) {
        throw error;
    }
    throw handleApiError(error, "Google Gemini (SEO)");
  }
};

// --- Google Ads Content Generation ---
export const generateGoogleAdsContent = async (
  brandInputs: BrandInputs,
  slogan: string
): Promise<AdsData> => {
  const ai = getAiClient();
  const adSchema = {
    type: Type.OBJECT,
    properties: {
      headlines: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array berisi 3-5 headline. Setiap headline HARUS di bawah 30 karakter."
      },
      descriptions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array berisi 2 deskripsi. Setiap deskripsi HARUS di bawah 90 karakter."
      },
      keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array berisi 5-7 kata kunci yang sangat relevan untuk ad group ini."
      }
    },
    required: ["headlines", "descriptions", "keywords"]
  };

  const finalSchema = {
    type: Type.OBJECT,
    properties: {
      ads: {
        type: Type.ARRAY,
        description: "Array berisi 3 alternatif teks iklan Google Ads yang lengkap.",
        items: adSchema
      }
    }
  };
  
  try {
    const prompt = `Kamu adalah seorang spesialis Google Ads untuk UMKM di Indonesia. Berdasarkan informasi bisnis ini:
- Nama Bisnis: "${brandInputs.businessName}"
- Industri: "${brandInputs.industry}"
- Target Pelanggan: "${brandInputs.targetAudience}"
- Nilai Jual Unik: "${brandInputs.valueProposition}"
- Slogan: "${slogan}"
Tugas: Buatkan 3 alternatif teks iklan (ad copy) untuk kampanye Google Search.
Untuk setiap alternatif, berikan:
1.  **Headlines**: 3-5 judul yang menarik dan relevan. Patuhi batas maksimal 30 karakter per judul.
2.  **Descriptions**: 2 deskripsi yang persuasif dan informatif. Patuhi batas maksimal 90 karakter per deskripsi.
3.  **Keywords**: 5-7 kata kunci yang paling cocok untuk grup iklan ini.
Pastikan semua output dalam Bahasa Indonesia dan sesuai dengan JSON schema yang diberikan.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: finalSchema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    const jsonString = response.text.trim();
    const result = safeJsonParse<{ ads: AdsData }>(jsonString, "Google Ads Content");
    if (!result || !Array.isArray(result.ads)) {
        throw new Error("Struktur data Iklan Google yang diterima dari AI tidak sesuai harapan.");
    }
    return result.ads;
  } catch(error) {
    if (error instanceof Error && (error.message.includes('ngelindur') || error.message.includes('tidak sesuai'))) {
        throw error;
    }
    throw handleApiError(error, "Google Gemini (Ads)");
  }
};


// --- Social Media Post Image Generation ---
export const generateSocialMediaPostImage = async (
    contentIdea: string,
    brandKeywords: string[]
): Promise<string[]> => {
    // A prompt designed to create visually appealing images without text, focusing on the theme.
    const prompt = `Create a visually stunning, high-quality social media post graphic suitable for an Instagram feed, in a 1:1 aspect ratio. The image should visually represent the following theme or idea: "${contentIdea}". The overall artistic style should be: ${brandKeywords.join(', ')}. IMPORTANT: The image must not contain any text, words, or letters. It should be a pure visual representation. Style: professional, commercial photography, vibrant, engaging, clean aesthetic.`;
    return generateImagesWithFlash(prompt, 1);
};

// --- Print Media Generation ---
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
        prompt = `A professional business card design for "${brandInputs.businessName}", in a 4:3 aspect ratio. Style: ${style}, clean, modern, print-ready. Colors: ${colors}. Logo described as: "${logoPrompt}". The card must legibly display: Name: ${name}, Title: ${title}, Phone: ${phone}, Email: ${email}, Website: ${website}. Realistic mockup.`;
    } else if (type === 'flyer' && brandInputs.flyerContent) {
        const { headline, body, cta } = brandInputs.flyerContent;
        prompt = `A professional A5 flyer design for "${brandInputs.businessName}", in a 3:4 aspect ratio. Style: ${style}, eye-catching, easy to read. Colors: ${colors}. Logo described as: "${logoPrompt}". Text: Headline: "${headline}" (large), Body: "${body}", CTA: "${cta}" (stands out). Realistic mockup.`;
    } else if (type === 'banner' && brandInputs.bannerContent) {
        const { headline, subheadline } = brandInputs.bannerContent;
        prompt = `A professional horizontal banner (spanduk) design for "${brandInputs.businessName}", in a 16:9 aspect ratio (like a 3x1 meter banner). Style: ${style}, highly visible from a distance. Colors: ${colors}. Logo described as: "${logoPrompt}" (large and clear). Text: Headline: "${headline}" (very large), Sub-headline: "${subheadline}". Realistic outdoor mockup.`;
    } else if (type === 'roll_banner' && brandInputs.rollBannerContent) {
        const { headline, body, contact } = brandInputs.rollBannerContent;
        prompt = `A professional vertical roll-up banner design for "${brandInputs.businessName}", in a 9:16 aspect ratio (like an 85x200 cm banner). Style: ${style}, elegant, informative. Colors: ${colors}. Logo described as: "${logoPrompt}" (at the top). Content: Headline: "${headline}" (top), Body: "${body}" (bullet points), Contact: "${contact}" (bottom). Realistic standing mockup.`;
    } else {
        throw new Error("Informasi yang dibutuhkan untuk generate media cetak tidak lengkap.");
    }
    return generateImagesWithFlash(prompt, 1);
};

// --- Packaging & Merchandise Generation ---
export const generatePackagingDesign = async (prompt: string): Promise<string[]> => {
  const fullPrompt = `2D packaging design mockup with a 4:3 aspect ratio, printable concept for a product. ${prompt}, flat lay, product photography style, clean background, commercial look.`;
  return generateImagesWithFlash(fullPrompt, 1);
};

export const generateMerchandiseMockup = async (prompt: string): Promise<string[]> => {
  return generateImagesWithFlash(prompt, 1);
};
