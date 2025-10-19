// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, Type, Modality, Part } from '@google/genai';
import { BrandPersona, BrandInputs, ProjectData, ContentCalendarEntry, CalendarSource, SocialProfiles, SocialMediaKit } from '../types';
import { createWhiteCanvasBase64 } from '../utils/imageUtils';

let ai: GoogleGenAI;

/**
 * Initializes and returns the GoogleGenAI client instance.
 * Throws an error if the API key is missing.
 */
export const getAiClient = (): GoogleGenAI => {
  if (ai) {
    return ai;
  }
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error('API key for Gemini (VITE_API_KEY) not found. Please check your environment variables.');
  }
  // FIX: Per coding guidelines, apiKey must be a named parameter.
  ai = new GoogleGenAI({ apiKey });
  return ai;
};


/**
 * A helper function to parse potentially malformed JSON responses from the AI.
 * It cleans up common issues like markdown code fences.
 */
const parseJsonResponse = <T>(text: string): T => {
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to parse JSON:", cleanText);
    throw new Error("Gagal memproses respons dari AI. Format tidak valid.");
  }
};


/**
 * Generates brand persona suggestions based on user inputs.
 */
export const generateBrandPersona = async (
  businessName: string,
  industry: string,
  targetAudience: string,
  valueProposition: string,
  competitorAnalysis: string | null,
): Promise<BrandPersona[]> => {
  const ai = getAiClient();
  const prompt = `
    Anda adalah seorang brand strategist profesional. Buatkan 3 alternatif brand persona untuk bisnis UMKM dengan detail berikut:
    - Nama Bisnis: ${businessName}
    - Industri: ${industry}
    - Target Audiens: ${targetAudience}
    - Value Proposition: ${valueProposition}
    ${competitorAnalysis ? `- Analisis Kompetitor: ${competitorAnalysis}` : ''}
    
    Setiap persona HARUS mencakup:
    1.  nama_persona: Nama yang catchy dan deskriptif untuk persona ini (e.g., "Si Paling Santai", "Sang Profesional Modern").
    2.  deskripsi_singkat: Satu paragraf singkat yang merangkum esensi persona.
    3.  gaya_bicara: Jelaskan gaya bahasa yang digunakan (e.g., "Santai, pakai bahasa gaul, ramah", "Formal, to the point, informatif").
    4.  palet_warna_hex: Array berisi 5 kode warna HEX yang merepresentasikan persona (e.g., ["#FFFFFF", "#000000"]).
    5.  keywords: Array berisi 5-7 kata kunci yang menggambarkan persona (e.g., ["minimalis", "modern", "bersih", "teknologi"]).
    6.  inspirasi_visual: Deskripsi singkat tentang gaya visual yang cocok untuk moodboard.

    Return HANYA dalam format JSON array, tanpa markdown. Contoh: [{"nama_persona": ...}, {"nama_persona": ...}]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            nama_persona: { type: Type.STRING },
            deskripsi_singkat: { type: Type.STRING },
            gaya_bicara: { type: Type.STRING },
            palet_warna_hex: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            inspirasi_visual: { type: Type.STRING },
          },
          required: ["nama_persona", "deskripsi_singkat", "gaya_bicara", "palet_warna_hex", "keywords", "inspirasi_visual"]
        }
      }
    }
  });

  return parseJsonResponse<BrandPersona[]>(response.text);
};

export const generateSlogans = async (brandInputs: BrandInputs, persona: BrandPersona): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `Buatkan 5 alternatif slogan yang catchy dan singkat untuk brand "${brandInputs.businessName}". Slogan harus sesuai dengan persona "${persona.nama_persona}" yang memiliki gaya bicara "${persona.gaya_bicara}" dan menonjolkan value proposition: "${brandInputs.valueProposition}". Return HANYA dalam format JSON array of strings, tanpa markdown. Contoh: ["Slogan 1", "Slogan 2"]`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    return parseJsonResponse<string[]>(response.text);
};


export const generateLogoPrompts = async (brandInputs: BrandInputs, persona: BrandPersona): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `
        Anda adalah seorang desainer logo berpengalaman. Buatkan 3 alternatif prompt deskriptif untuk AI image generator (seperti Imagen) untuk membuat logo brand "${brandInputs.businessName}". 
        Prompt harus detail dan mencerminkan persona brand "${persona.nama_persona}" dengan inspirasi visual "${persona.inspirasi_visual}" dan palet warna (${persona.palet_warna_hex.join(', ')}).
        Gaya logo yang diinginkan adalah modern, minimalis, dan mudah diingat.
        Setiap prompt harus berfokus pada gaya yang sedikit berbeda (misal: satu fokus pada ikon, satu pada tipografi, satu abstrak).
        Return HANYA dalam format JSON array of strings, tanpa markdown. Contoh: ["prompt 1", "prompt 2"]
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    return parseJsonResponse<string[]>(response.text);
};

export const generateLogoImage = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `logo for a brand, ${prompt}, vector, simple, flat design, on a clean white background` }] },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imagePartResponse || !imagePartResponse.inlineData) {
        throw new Error("AI tidak menghasilkan gambar. Coba lagi dengan prompt berbeda.");
    }
    return `data:image/webp;base64,${imagePartResponse.inlineData.data}`;
};

export const generateLogoVariations = async (logoUrl: string): Promise<Record<string, string>> => {
    const ai = getAiClient();
    const imageBase64 = logoUrl.split(',')[1];
    const imagePart: Part = { inlineData: { data: imageBase64, mimeType: 'image/webp' } };

    const prompts = {
        stacked: 'rearrange this logo into a stacked, more vertical composition. keep the style identical. place it on a clean white background.',
        horizontal: 'rearrange this logo into a horizontal, wider composition. keep the style identical. place it on a clean white background.',
        monochrome: 'convert this logo into a monochrome (black on a clean white background) version. keep the shapes identical.',
    };

    const variations: Record<string, string> = {};

    for (const key of Object.keys(prompts)) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, { text: prompts[key as keyof typeof prompts] }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                }
            });
            const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (imagePartResponse?.inlineData) {
                variations[key] = `data:image/webp;base64,${imagePartResponse.inlineData.data}`;
            }
        } catch (e) {
            console.error(`Failed to generate variation "${key}":`, e);
        }
    }
    return variations;
};

export const generateSocialMediaKitAssets = async (projectData: ProjectData): Promise<SocialMediaKit> => {
    const ai = getAiClient();
    if (!projectData.selectedLogoUrl || !projectData.selectedPersona) throw new Error("Logo dan persona dibutuhkan.");

    const logoBase64 = projectData.selectedLogoUrl.split(',')[1];
    const logoPart: Part = { inlineData: { data: logoBase64, mimeType: 'image/webp' } };

    const commonPrompt = `using the provided logo and brand persona (visual inspiration: ${projectData.selectedPersona.inspirasi_visual}, colors: ${projectData.selectedPersona.palet_warna_hex.join(', ')})`;
    
    const pfpResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [logoPart, { text: `create a simple, clean, and eye-catching circular profile picture ${commonPrompt}. The logo should be clearly visible and centered.` }] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const profilePictureB64 = pfpResponse.candidates?.[0]?.content.parts[0].inlineData?.data;

    const bannerResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [logoPart, { text: `create a social media banner (aspect ratio 16:9) ${commonPrompt}. The design should be clean, professional, and have space for text overlays. The logo should be placed tastefully, not necessarily in the center.` }] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const bannerB64 = bannerResponse.candidates?.[0]?.content.parts[0].inlineData?.data;

    if (!profilePictureB64 || !bannerB64) throw new Error("Gagal membuat aset visual.");

    return { profilePictureUrl: `data:image/webp;base64,${profilePictureB64}`, bannerUrl: `data:image/webp;base64,${bannerB64}` };
};

export const generateSocialProfiles = async (brandInputs: BrandInputs, persona: BrandPersona): Promise<SocialProfiles> => {
    const ai = getAiClient();
    const prompt = `
        Anda adalah seorang copywriter media sosial. Buatkan teks profil untuk brand "${brandInputs.businessName}" dengan persona "${persona.nama_persona}".
        - Bisnis: ${brandInputs.industry}, ${brandInputs.valueProposition}.
        
        Buatkan untuk platform berikut:
        1. instagramBio: Bio Instagram yang menarik, informatif, dan menyertakan Call-to-Action. Gunakan emoji.
        2. tiktokBio: Bio TikTok yang singkat, punchy, dan sesuai tren.
        3. marketplaceDescription: Deskripsi singkat untuk halaman toko di marketplace (Tokopedia/Shopee) yang meyakinkan pembeli.
        
        Return HANYA dalam format JSON object, tanpa markdown. Contoh: {"instagramBio": "...", "tiktokBio": "...", "marketplaceDescription": "..."}
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    instagramBio: { type: Type.STRING },
                    tiktokBio: { type: Type.STRING },
                    marketplaceDescription: { type: Type.STRING },
                },
                required: ["instagramBio", "tiktokBio", "marketplaceDescription"]
            }
        }
    });
    return parseJsonResponse<SocialProfiles>(response.text);
};

export const generateContentCalendar = async (projectName: string, persona: BrandPersona): Promise<{ calendar: ContentCalendarEntry[], sources: CalendarSource[] }> => {
    const ai = getAiClient();
    const prompt = `
        Anda adalah seorang content strategist. Buatkan rencana konten media sosial untuk 7 hari ke depan untuk brand "${projectName}" dengan persona "${persona.nama_persona}" dan gaya bicara "${persona.gaya_bicara}".
        Gunakan Google Search untuk mencari topik atau ide yang relevan dan sedang tren terkait kata kunci berikut: ${persona.keywords.join(', ')}.
        
        Untuk setiap hari, berikan:
        - hari: Nama hari (e.g., "Senin").
        - tipe_konten: Jenis konten (e.g., "Edukasi", "Promosi", "Interaksi", "Behind the Scenes").
        - ide_konten: Judul atau ide utama konten.
        - draf_caption: Draf caption singkat yang sesuai gaya bicara persona.
        - hashtag: Array berisi 3-5 hashtag yang relevan.
        
        Return HANYA dalam format JSON object dengan key "calendar" yang berisi array dari 7 entri hari, tanpa markdown.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });

    const parsed = parseJsonResponse<{ calendar: ContentCalendarEntry[] }>(response.text);
    const sources: CalendarSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({ web: chunk.web })) || [];

    return { calendar: parsed.calendar, sources };
};

export const enhancePromptWithPersonaStyle = (prompt: string, persona: BrandPersona | null): string => {
    if (!persona) return prompt;
    return `${prompt}, with a visual style of ${persona.inspirasi_visual}, using a color palette of ${persona.palet_warna_hex.join(', ')}`;
};

export const generateMascot = async (prompt: string): Promise<string[]> => {
    const ai = getAiClient();
    const finalPrompt = `vector illustration of a cute mascot character for a brand. ${prompt}. simple, flat design, white background.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const images = response.candidates?.[0]?.content?.parts
      .filter(part => part.inlineData)
      .map(part => `data:image/webp;base64,${part.inlineData!.data}`) ?? [];
    if (images.length === 0) throw new Error("AI tidak menghasilkan gambar maskot.");
    return images;
};

export const generateMoodboardText = async (keywords: string): Promise<{ description: string; palette: string[] }> => {
    const ai = getAiClient();
    const prompt = `Based on the keywords "${keywords}", create a brand moodboard concept. Provide: 1. description: A short paragraph describing the overall vibe. 2. palette: An array of 5 hex color codes. Return ONLY a JSON object.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["description", "palette"]
            }
        }
    });
    return parseJsonResponse<{ description: string; palette: string[] }>(response.text);
};

export const generateMoodboardImages = async (keywords: string): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `photorealistic, aesthetic, moodboard images related to: ${keywords}. 4 images.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 4, aspectRatio: "1:1" },
    });

    const images = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
    if (images.length === 0) throw new Error("Gagal membuat gambar moodboard.");
    return images;
};

export const generatePattern = async (prompt: string): Promise<string[]> => {
    const ai = getAiClient();
    const finalPrompt = `seamless pattern, ${prompt}. vector, simple, flat design.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const images = response.candidates?.[0]?.content?.parts
        .filter(part => part.inlineData)
        .map(part => `data:image/webp;base64,${part.inlineData!.data}`) ?? [];
    if (images.length === 0) throw new Error("AI tidak menghasilkan gambar pola.");
    return images;
};

export const applyPatternToMockup = async (patternUrl: string, mockupAssetUrl: string): Promise<string> => {
    const ai = getAiClient();
    const patternBase64 = patternUrl.split(',')[1];
    const patternPart: Part = { inlineData: { data: patternBase64, mimeType: 'image/webp' } };

    const prompt = `Apply this seamless pattern to a plain white object like the one in the reference image. The pattern should cover the object realistically, following its contours.`;

    // This is a placeholder for actual image fetching which might be complex due to CORS etc.
    // In a real app, we'd fetch mockupAssetUrl into a base64 string.
    const whiteCanvasBase64 = createWhiteCanvasBase64().split(',')[1];
    const mockupPart: Part = { inlineData: { data: whiteCanvasBase64, mimeType: 'image/png' } };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [mockupPart, patternPart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imagePartResponse || !imagePartResponse.inlineData) {
        throw new Error("AI tidak menghasilkan gambar mockup.");
    }
    return `data:image/webp;base64,${imagePartResponse.inlineData.data}`;
};

export const removeBackground = async (imageUrl: string): Promise<string> => {
    const ai = getAiClient();
    const imageBase64 = imageUrl.split(',')[1];
    const imagePart: Part = { inlineData: { data: imageBase64, mimeType: 'image/png' } };
    const textPart: Part = { text: 'remove the background from this image, leaving only the main subject with a transparent background.' };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imagePartResponse || !imagePartResponse.inlineData) {
        throw new Error("Gagal menghapus background.");
    }
    return `data:image/webp;base64,${imagePartResponse.inlineData.data}`;
};

export const generateProductPhoto = async (productImageUrl: string, scenePrompt: string): Promise<string> => {
    const ai = getAiClient();
    const imageBase64 = productImageUrl.split(',')[1];
    const imagePart: Part = { inlineData: { data: imageBase64, mimeType: 'image/webp' } };
    const textPart: Part = { text: `Place this product image (which has a transparent background) into a realistic scene described as: "${scenePrompt}". The lighting should be professional and match the scene. product photography, high quality.` };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imagePartResponse || !imagePartResponse.inlineData) {
        throw new Error("Gagal membuat foto produk.");
    }
    return `data:image/webp;base64,${imagePartResponse.inlineData.data}`;
};

export const generateSceneFromImages = async (imageUrls: string[], prompt: string): Promise<string> => {
    const ai = getAiClient();
    const parts: Part[] = imageUrls.map(url => ({
        inlineData: {
            data: url.split(',')[1],
            mimeType: url.substring(url.indexOf(':') + 1, url.indexOf(';')),
        }
    }));
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imagePartResponse || !imagePartResponse.inlineData) {
        throw new Error("Gagal menggabungkan gambar.");
    }
    return `data:image/webp;base64,${imagePartResponse.inlineData.data}`;
};

export const generateVideo = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Gagal membuat video.");
    }
    return downloadLink;
};
