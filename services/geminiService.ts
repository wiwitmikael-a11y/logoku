
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { BrandPersona, ContentCalendarEntry, LogoVariations, BrandInputs, Project } from '../types';

let ai: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI client.
 * This prevents the app from crashing on startup if the API key is missing.
 * @returns An initialized GoogleGenAI instance.
 * @throws An error if the API key is not configured.
 */
const getAiClient = (): GoogleGenAI => {
    // If the client is already initialized, return it.
    if (ai) {
        return ai;
    }

    let apiKey: string | undefined;
    try {
        // In a Vercel environment, browser-accessible environment variables
        // MUST be prefixed with NEXT_PUBLIC_.
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.NEXT_PUBLIC_API_KEY;
        }
    } catch (e) {
        console.warn("Could not access process.env. This is expected in some environments.");
    }
    
    // If the API key is missing, throw a user-friendly error with clear instructions.
    if (!apiKey) {
        throw new Error("Waduh, API Key Mang AI nggak ketemu, bro! Pastiin lo udah set 'Environment Variable' di Vercel dengan nama 'NEXT_PUBLIC_API_KEY' (bukan cuma 'API_KEY'). Abis itu, deploy ulang project-nya ya.");
    }
    
    // Initialize the client, cache it, and return it.
    ai = new GoogleGenAI({ apiKey });
    return ai;
};


/**
 * A centralized error handler for Gemini API calls.
 * It logs the technical error and returns a new Error with a user-friendly,
 * casual message suitable for the app's tone.
 * @param error The original error caught from the API call.
 * @param defaultMessage A fallback message for unknown errors.
 * @returns A new Error object with a user-friendly message.
 */
const handleApiError = (error: any, defaultMessage: string): Error => {
    console.error("Gemini API Error:", error);

    // Try to get a meaningful message from the error object
    const errorString = (error instanceof Error ? error.message : JSON.stringify(error)).toLowerCase();

    let friendlyMessage = defaultMessage;

    if (errorString.includes('resource_exhausted') || errorString.includes('quota')) {
        friendlyMessage = `Waduh, udud Mang AI habis euy. Beliin dulu udud sebatang mah bro, atau coba lagi besok.`;
    } else if (errorString.includes('prompt was blocked') || errorString.includes('safety')) {
        friendlyMessage = `Request lo diblokir karena isinya kurang aman menurut Mang AI. Coba ubah prompt atau input-nya ya.`;
    } else if (errorString.includes('api key not valid')) {
        friendlyMessage = `Waduh, API Key-nya nggak valid, bro. Pastiin API Key di environment udah bener.`;
    } else if (errorString.includes("nggak ketemu, bro!")) { // Catches our custom API key error
        return new Error(error.message);
    }

    return new Error(friendlyMessage);
};


export const generateBrandPersona = async (
  businessName: string,
  industry: string,
  targetAudience: string,
  valueProposition: string
): Promise<BrandPersona[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Kamu adalah seorang brand strategist ahli untuk UMKM Indonesia. Berdasarkan info ini:
- Nama Bisnis: "${businessName}"
- Industri: ${industry}
- Target Pelanggan: ${targetAudience}
- Nilai Jual: ${valueProposition}

Buatkan 3 alternatif persona brand yang komprehensif dalam format JSON. Setiap persona harus mencakup:
1. 'nama_persona': Nama yang catchy.
2. 'deskripsi_singkat': Penjelasan singkat.
3. 'kata_kunci': Array 3-5 kata kunci.
4. 'palet_warna_hex': Array 3 hex codes.
5. 'customer_avatars': Array berisi 2 objek 'Avatar Pelanggan' detail (nama_avatar, deskripsi_demografis, pain_points, media_sosial).
6. 'brand_voice': Objek berisi 'deskripsi', 'kata_yang_digunakan', dan 'kata_yang_dihindari'.
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nama_persona: { type: Type.STRING },
              deskripsi_singkat: { type: Type.STRING },
              kata_kunci: { type: Type.ARRAY, items: { type: Type.STRING } },
              palet_warna_hex: { type: Type.ARRAY, items: { type: Type.STRING } },
              customer_avatars: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        nama_avatar: { type: Type.STRING },
                        deskripsi_demografis: { type: Type.STRING },
                        pain_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                        media_sosial: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["nama_avatar", "deskripsi_demografis", "pain_points", "media_sosial"],
                }
              },
              brand_voice: {
                type: Type.OBJECT,
                properties: {
                    deskripsi: { type: Type.STRING },
                    kata_yang_digunakan: { type: Type.ARRAY, items: { type: Type.STRING } },
                    kata_yang_dihindari: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["deskripsi", "kata_yang_digunakan", "kata_yang_dihindari"],
              }
            },
            required: ["nama_persona", "deskripsi_singkat", "kata_kunci", "palet_warna_hex", "customer_avatars", "brand_voice"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);

  } catch (error) {
    throw handleApiError(error, "Gagal generate persona brand. Coba cek console buat detailnya.");
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
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw handleApiError(error, "Gagal generate slogan. Coba lagi nanti.");
    }
};


export const generateLogoOptions = async (prompt: string): Promise<string[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 4,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
  } catch (error) {
    throw handleApiError(error, "Gagal generate logo. Mungkin prompt-nya bermasalah menurut model AI.");
  }
};

export const generateLogoVariations = async (basePrompt: string): Promise<LogoVariations> => {
    const ai = getAiClient();
    try {
        const generate = async (modifier: string, count: number = 1) => {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `${basePrompt}, ${modifier}`,
                config: {
                    numberOfImages: count,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
            return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        };

        const [icon, monochrome] = await Promise.all([
            generate('simplified icon only, clean, centered'),
            generate('monochrome, black and white version')
        ]);
        
        // We don't have the original image data, so we re-generate the "main" one.
        // In a real app, we'd pass the original data URL.
        const main = await generate('standard version');

        return { main, icon, monochrome };

    } catch (error) {
        throw handleApiError(error, "Gagal generate variasi logo.");
    }
};

export const editLogo = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        throw new Error("Mang AI tidak menghasilkan gambar editan.");

    } catch (error) {
        throw handleApiError(error, "Gagal mengedit logo.");
    }
};


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
      // Fix: Removed responseMimeType and responseSchema as they are not allowed with the googleSearch tool.
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    let jsonString = response.text.trim();
    // Handle cases where the response might be wrapped in ```json ... ```
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const parsedJson = JSON.parse(jsonString);

    return { calendar: parsedJson.calendar, sources };

  } catch (error) {
    throw handleApiError(error, "Gagal generate kalender konten. Coba cek console buat detailnya.");
  }
};

export const generatePrintMedia = async (
    type: 'business_card' | 'flyer' | 'banner' | 'roll_banner',
    project: Omit<Project, 'id' | 'createdAt'>
): Promise<string[]> => {
    const ai = getAiClient();
    let prompt = '';
    const { brandInputs, selectedPersona, logoPrompt } = project;
    const style = selectedPersona.kata_kunci.join(', ');
    const colors = selectedPersona.palet_warna_hex.join(', ');

    if (type === 'business_card' && brandInputs.contactInfo) {
        const { name, title, phone, email, website } = brandInputs.contactInfo;
        prompt = `A professional business card design for "${brandInputs.businessName}".
        Style should be: ${style}. The design must be clean, modern, and print-ready.
        Use the color palette: ${colors}.
        The business logo is described as: "${logoPrompt}". The logo must be prominently featured.
        The card must legibly display this information:
        - Name: ${name}
        - Title: ${title}
        - Phone: ${phone}
        - Email: ${email}
        - Website: ${website}
        Show a realistic mockup of the business card.`;
    } else if (type === 'flyer' && brandInputs.flyerContent) {
        const { headline, body, cta } = brandInputs.flyerContent;
        prompt = `A professional A5 flyer design for a promotion by "${brandInputs.businessName}".
        Style should be: ${style}. The design must be eye-catching and easy to read.
        Use the color palette: ${colors}.
        The business logo is described as: "${logoPrompt}". The logo must be clearly visible.
        The flyer must contain the following text:
        - Headline: "${headline}" (make this large and impactful)
        - Body: "${body}"
        - Call to Action: "${cta}" (make this stand out, e.g., in a button or a special section)
        Show a realistic mockup of the flyer.`;
    } else if (type === 'banner' && brandInputs.bannerContent) {
        const { headline, subheadline } = brandInputs.bannerContent;
        prompt = `A professional horizontal banner (spanduk) design, to be printed for outdoor use. Common Indonesian size is 3x1 meters.
        The business is "${brandInputs.businessName}".
        Style should be: ${style}. The design must be highly visible from a distance.
        Use the color palette: ${colors}.
        The business logo is described as: "${logoPrompt}". The logo must be large and clear.
        The banner must contain the following text:
        - Headline: "${headline}" (very large and readable)
        - Sub-headline: "${subheadline}" (smaller, but still clear)
        Show a realistic mockup of the banner displayed outdoors.`;
    } else if (type === 'roll_banner' && brandInputs.rollBannerContent) {
        const { headline, body, contact } = brandInputs.rollBannerContent;
        prompt = `A professional vertical roll-up banner design for indoor events. Common Indonesian size is 85x200 cm.
        The business is "${brandInputs.businessName}".
        Style should be: ${style}. The design must be elegant and informative.
        Use the color palette: ${colors}.
        The business logo is described as: "${logoPrompt}". The logo should be placed at the top.
        The roll-up banner must contain:
        - Headline: "${headline}" (large and at the top)
        - Body: "${body}" (bullet points or short sentences)
        - Contact/Info: "${contact}" (at the bottom, e.g., website or social media handle)
        Show a realistic mockup of the roll-up banner standing.`;
    } else {
        throw new Error("Informasi yang dibutuhkan untuk generate media cetak tidak lengkap.");
    }

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/jpeg',
                aspectRatio: type === 'business_card' ? '16:9' : type === 'flyer' ? '4:3' : type === 'banner' ? '16:9' : '9:16',
            },
        });

        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
    } catch (error) {
        throw handleApiError(error, "Gagal generate desain media cetak.");
    }
};

export const generatePackagingDesign = async (prompt: string): Promise<string[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `2D packaging design mockup, printable concept for a product. ${prompt}, flat lay, product photography style, clean background, commercial look.`,
      config: {
        numberOfImages: 4,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
      },
    });

    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
  } catch (error) {
    throw handleApiError(error, "Gagal generate desain kemasan. Mungkin prompt-nya bermasalah menurut model AI.");
  }
};

export const generateMerchandiseMockup = async (prompt: string): Promise<string[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 4,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
  } catch (error) {
    throw handleApiError(error, "Gagal generate mockup merchandise. Coba lagi.");
  }
};
