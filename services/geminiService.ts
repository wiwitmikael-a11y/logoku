
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { BrandPersona, ContentCalendarEntry, LogoVariations, BrandInputs, Project } from '../types';

// --- Service URLs ---
const HF_API_URL_SDXL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

// --- Gemini Client Setup ---
let ai: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI => {
    if (ai) return ai;
    // FIX: Switched from import.meta.env.VITE_API_KEY to process.env.API_KEY to resolve TS error and align with guidelines.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Waduh, API Key Google Gemini (API_KEY) nggak ketemu, bro! Pastiin lo udah set Environment Variable dengan nama 'API_KEY'. Abis itu, deploy ulang ya.");
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
};

// --- New API Key Getters ---
const getHuggingFaceKey = (): string => {
    // FIX: Switched from import.meta.env.VITE_HF_API_KEY to process.env.HF_API_KEY to resolve TS error.
    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
        throw new Error("Waduh, API Key Hugging Face (HF_API_KEY) nggak ketemu, bro! Set Environment Variable dengan nama 'HF_API_KEY'.");
    }
    return apiKey;
};

/**
 * A centralized error handler for all AI API calls.
 * It logs the technical error and returns a new Error with a user-friendly message.
 * @param error The original error caught from the API call.
 * @param serviceName The name of the service that failed (e.g., "Google Gemini").
 * @returns A new Error object with a user-friendly message.
 */
const handleApiError = (error: any, serviceName: string): Error => {
    console.error(`${serviceName} API Error:`, error);
    const errorString = (error instanceof Error ? error.message : JSON.stringify(error)).toLowerCase();

    // Hugging Face model loading error
    if (serviceName === "Hugging Face" && errorString.includes('model') && (errorString.includes('is currently loading') || errorString.includes('currently loading'))) {
        const timeMatch = errorString.match(/estimated_time":\s*([\d.]+)/);
        const waitTime = timeMatch ? ` sekitar ${Math.ceil(parseFloat(timeMatch[1]))} detik` : '';
        return new Error(`Sabar bro, mesin gambar Mang AI (${serviceName}) lagi dipanasin. Coba lagi${waitTime}.`);
    }

    // Gemini-specific errors
    if (serviceName === "Google Gemini") {
        if (errorString.includes('resource_exhausted') || errorString.includes('quota')) {
            return new Error(`Waduh, udud Mang AI habis euy. Jatah API ${serviceName} udah abis, coba lagi besok.`);
        }
        if (errorString.includes('prompt was blocked') || errorString.includes('safety')) {
            return new Error(`Request lo ke ${serviceName} diblokir karena isinya kurang aman. Coba ubah prompt atau input-nya ya.`);
        }
    }

    // Generic key/auth errors
    if (errorString.includes('api key') || errorString.includes('authorization') || errorString.includes('api key not valid')) {
        return new Error(`Waduh, API Key buat ${serviceName} kayaknya salah atau nggak valid, bro. Cek lagi gih.`);
    }

    // Catch our custom API key missing errors
    if (errorString.includes("nggak ketemu, bro!")) {
        return new Error((error as Error).message);
    }
    
    return new Error(`Gagal manggil ${serviceName}. Coba cek console buat detailnya.`);
};

// --- REWRITTEN with Gemini API to fix environment key issues ---
export const generateBrandPersona = async (
  businessName: string,
  industry: string,
  targetAudience: string,
  valueProposition: string
): Promise<BrandPersona[]> => {
  const ai = getAiClient();

  // Define the complex JSON schema for the BrandPersona type
  const brandVoiceSchema = {
    type: Type.OBJECT,
    properties: {
        deskripsi: { type: Type.STRING },
        kata_yang_digunakan: { type: Type.ARRAY, items: { type: Type.STRING } },
        kata_yang_dihindari: { type: Type.ARRAY, items: { type: Type.STRING } },
    }
  };

  const customerAvatarSchema = {
      type: Type.OBJECT,
      properties: {
          nama_avatar: { type: Type.STRING },
          deskripsi_demografis: { type: Type.STRING },
          pain_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          media_sosial: { type: Type.ARRAY, items: { type: Type.STRING } },
      }
  };

  const brandPersonaSchema = {
      type: Type.OBJECT,
      properties: {
          nama_persona: { type: Type.STRING },
          deskripsi_singkat: { type: Type.STRING },
          kata_kunci: { type: Type.ARRAY, items: { type: Type.STRING } },
          palet_warna_hex: { type: Type.ARRAY, items: { type: Type.STRING } },
          customer_avatars: { type: Type.ARRAY, items: customerAvatarSchema },
          brand_voice: brandVoiceSchema,
      }
  };
  
  const finalSchema = {
      type: Type.OBJECT,
      properties: {
          personas: {
              type: Type.ARRAY,
              description: "Array dari 3 alternatif persona brand yang komprehensif.",
              items: brandPersonaSchema
          }
      }
  };

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
        }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result.personas;

  } catch (error) {
    throw handleApiError(error, "Google Gemini");
  }
};

// --- UNCHANGED (using Gemini) ---
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

// --- NEW: Generic Hugging Face Image Generation function ---
const generateImagesWithHuggingFace = async (prompt: string, count: number): Promise<string[]> => {
    const apiKey = getHuggingFaceKey();
    
    const generateSingleImage = async (): Promise<string> => {
        const response = await fetch(HF_API_URL_SDXL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
        }
        
        const blob = await response.blob();
        if (blob.type.includes('json')) {
             const errorJson = JSON.parse(await blob.text());
             throw new Error(JSON.stringify(errorJson));
        }

        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const results: string[] = [];
    for (let i = 0; i < count; i++) {
        try {
            const result = await generateSingleImage();
            results.push(result);
        } catch (error) {
            throw handleApiError(error, "Hugging Face");
        }
    }
    return results;
};

// --- REWRITTEN with Hugging Face ---
export const generateLogoOptions = async (prompt: string): Promise<string[]> => {
  return generateImagesWithHuggingFace(prompt, 4);
};

// --- REWRITTEN with Hugging Face (and more efficient) ---
export const generateLogoVariations = async (basePrompt: string): Promise<Omit<LogoVariations, 'main'>> => {
    try {
        const [iconResult, monochromeResult] = await Promise.all([
            generateImagesWithHuggingFace(`${basePrompt}, simplified icon only, clean, centered`, 1),
            generateImagesWithHuggingFace(`${basePrompt}, monochrome, black and white version`, 1)
        ]);
        if (!iconResult[0] || !monochromeResult[0]) {
            throw new Error("Gagal generate salah satu variasi logo.");
        }
        return { icon: iconResult[0], monochrome: monochromeResult[0] };
    } catch(error) {
        throw error; // The inner function already handles the error with a user-friendly message.
    }
};

// --- UNCHANGED (using Gemini for image editing) ---
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
        throw handleApiError(error, "Google Gemini");
    }
};

// --- UNCHANGED (using Gemini with Google Search) ---
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
    throw handleApiError(error, "Google Gemini");
  }
};

// --- REWRITTEN with Hugging Face ---
export const generatePrintMedia = async (
    type: 'business_card' | 'flyer' | 'banner' | 'roll_banner',
    project: Omit<Project, 'id' | 'createdAt'>
): Promise<string[]> => {
    let prompt = '';
    const { brandInputs, selectedPersona, logoPrompt } = project;
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
    return generateImagesWithHuggingFace(prompt, 4);
};

// --- REWRITTEN with Hugging Face ---
export const generatePackagingDesign = async (prompt: string): Promise<string[]> => {
  const fullPrompt = `2D packaging design mockup, printable concept for a product. ${prompt}, flat lay, product photography style, clean background, commercial look.`;
  return generateImagesWithHuggingFace(fullPrompt, 4);
};

// --- REWRITTEN with Hugging Face ---
export const generateMerchandiseMockup = async (prompt: string): Promise<string[]> => {
  return generateImagesWithHuggingFace(prompt, 4);
};
