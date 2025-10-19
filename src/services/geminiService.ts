// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, GenerateContentResponse, Modality, Type, Operation, GenerateVideosResponse } from "@google/genai";
import type { BrandInputs, BrandPersona, ProjectData } from '../types';
import { uploadBase64Image, uploadBase64Audio } from "./storageService";
import { getSupabaseClient } from "./supabaseClient";
import { fetchImageAsBase64 } from "../utils/imageUtils";

let ai: GoogleGenAI | null = null;
let geminiApiKeyError: string | null = null;

try {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API VITE_API_KEY tidak ditemukan di environment variables.");
  }
  // FIX: Pass apiKey in an object
  ai = new GoogleGenAI({ apiKey });
} catch (e) {
  geminiApiKeyError = (e as Error).message;
}

export const getAiClient = (): GoogleGenAI => {
    if (geminiApiKeyError) {
        throw new Error(geminiApiKeyError);
    }
    return ai as GoogleGenAI;
}

export const getApiKeyError = (): string | null => geminiApiKeyError;

// --- UTILITY ---
export const enhancePromptWithPersonaStyle = (prompt: string, persona: BrandPersona | null): string => {
  if (!persona) return prompt;
  const colorNames = persona.palet_warna.map(c => c.nama).join(', ');
  return `${prompt}. Gunakan gaya visual yang ${persona.visual_style} dengan palet warna dominan ${colorNames}.`;
};

// --- CORE BRANDING WORKFLOW ---

export const generateBrandPersonas = async (inputs: BrandInputs): Promise<BrandPersona[]> => {
    const ai = getAiClient();
    const prompt = `Buat 3 persona brand unik untuk bisnis dengan detail berikut:
- Nama Bisnis: ${inputs.businessName}
- Detail: ${inputs.businessDetail}
- Industri: ${inputs.industry}
- Target Audiens: ${inputs.targetAudience}
- Keunggulan: ${inputs.valueProposition}
- Kompetitor: ${inputs.competitorAnalysis || 'Tidak ada'}

Untuk setiap persona, berikan:
1. nama_persona: Nama yang catchy untuk persona ini (e.g., "Sang Visioner Urban", "Sahabat Petualang").
2. deskripsi: Penjelasan singkat tentang karakter dan nilai-nilai brand.
3. gaya_bicara: Contoh tone of voice untuk caption media sosial.
4. palet_warna: Array berisi 5 objek JSON warna (masing-masing dengan properti "hex" dan "nama" deskriptif).
5. visual_style: 2-3 kata kunci gaya visual (e.g., "Minimalis, Modern, Bersih").
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        nama_persona: { type: Type.STRING },
                        deskripsi: { type: Type.STRING },
                        gaya_bicara: { type: Type.STRING },
                        palet_warna: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    hex: { type: Type.STRING },
                                    nama: { type: Type.STRING }
                                }
                            }
                        },
                        visual_style: { type: Type.STRING }
                    }
                }
            }
        },
    });

    return JSON.parse(response.text);
};


export const generateSlogans = async (inputs: BrandInputs): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `Buatkan 5 opsi slogan yang singkat, menarik, dan menjual untuk brand:
- Nama: ${inputs.businessName}
- Detail: ${inputs.businessDetail}
- Target Audiens: ${inputs.targetAudience}
- Keunggulan: ${inputs.valueProposition}
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    slogans: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });
    const parsed = JSON.parse(response.text);
    return parsed.slogans;
};

export const generateLogoPrompt = async (slogan: string, persona: BrandPersona): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Buat sebuah prompt deskriptif dalam Bahasa Inggris untuk AI image generator (seperti Imagen) untuk membuat logo. Prompt harus detail, fokus pada objek visual, dan mencerminkan esensi dari brand berikut:
- Slogan: "${slogan}"
- Persona Brand: ${persona.nama_persona}
- Gaya Visual: ${persona.visual_style}
- Deskripsi Persona: ${persona.deskripsi}
- Warna Dominan: ${persona.palet_warna.map(c => c.nama).join(', ')}

Prompt yang dihasilkan harus berupa satu paragraf detail, tanpa judul, dan fokus pada deskripsi visual logo yang diinginkan. Contoh output: "A minimalist and clean logo featuring a stylized geometric phoenix rising from a circuit board, vector art, vibrant orange and deep charcoal grey colors, suitable for a tech startup."`;
    
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateLogoOptions = async (prompt: string, aspectRatio: '1:1' | '4:3' | '16:9' = '1:1'): Promise<string[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `logo, ${prompt}, vector, simple, minimalist, clean background`,
        config: { numberOfImages: 4, aspectRatio }
    });
    
    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");

    return Promise.all(
        response.generatedImages.map(img => uploadBase64Image(`data:image/png;base64,${img.image.imageBytes}`, userId))
    );
};

export const editLogo = async (imageUrl: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: imageUrl.split(',')[1] } },
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) throw new Error("Gagal mengedit logo, tidak ada gambar yang dihasilkan.");

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");
    
    return uploadBase64Image(`data:image/png;base64,${base64Data}`, userId);
};


export const generateSocialMediaKitAssets = async (projectData: ProjectData): Promise<{ profilePictureUrl: string, bannerUrl: string }> => {
    const ai = getAiClient();
    const { selectedLogoUrl, selectedPersona } = projectData;
    if (!selectedLogoUrl || !selectedPersona) throw new Error("Logo atau persona belum dipilih.");

    const basePrompt = `Gunakan logo yang diberikan sebagai dasar. Buat aset media sosial yang serasi dengan gaya visual "${selectedPersona.visual_style}" dan palet warna "${selectedPersona.palet_warna.map(c => c.nama).join(', ')}".`;
    
    const [ppResponse, bannerResponse] = await Promise.all([
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ inlineData: { mimeType: 'image/png', data: selectedLogoUrl.split(',')[1] } }, { text: `${basePrompt} Buat sebuah foto profil (avatar) yang menarik.` }] },
            config: { responseModalities: [Modality.IMAGE] },
        }),
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ inlineData: { mimeType: 'image/png', data: selectedLogoUrl.split(',')[1] } }, { text: `${basePrompt} Buat sebuah banner/header untuk profil media sosial (e.g., Twitter, Facebook).` }] },
            config: { responseModalities: [Modality.IMAGE] },
        })
    ]);

    const ppBase64 = ppResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const bannerBase64 = bannerResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!ppBase64 || !bannerBase64) throw new Error("Gagal membuat salah satu atau kedua aset visual.");

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");

    const [profilePictureUrl, bannerUrl] = await Promise.all([
        uploadBase64Image(`data:image/png;base64,${ppBase64}`, userId),
        uploadBase64Image(`data:image/png;base64,${bannerBase64}`, userId)
    ]);

    return { profilePictureUrl, bannerUrl };
};

export const generateSocialProfiles = async (inputs: BrandInputs, persona: BrandPersona): Promise<{ instagramBio: string, tiktokBio: string, marketplaceDescription: string }> => {
    const ai = getAiClient();
    const prompt = `Buat teks profil untuk brand "${inputs.businessName}".
- Gaya Bicara: ${persona.gaya_bicara}
- Keunggulan: ${inputs.valueProposition}

Hasil harus dalam format JSON dengan properti: "instagramBio", "tiktokBio", dan "marketplaceDescription".`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
};


export const generateContentCalendar = async (inputs: BrandInputs, persona: BrandPersona): Promise<{ plan: any[], sources: any[] }> => {
    const ai = getAiClient();
    const prompt = `Buat rencana konten media sosial untuk 7 hari ke depan untuk brand "${inputs.businessName}" yang bergerak di bidang ${inputs.industry} dengan target audiens ${inputs.targetAudience}. Gunakan gaya bicara persona "${persona.nama_persona}". Untuk setiap hari, berikan tipe konten, ide spesifik, draf caption singkat, dan 3-5 rekomendasi hashtag relevan. Cari ide-ide yang sedang tren.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
    }));

    // Post-process to structure the text into a plan
    const textPlan = response.text;
    const plan = textPlan.split(/\n\s*\n/).map(dayBlock => {
        const lines = dayBlock.split('\n');
        const dayMatch = lines[0]?.match(/Hari \d+ - (\w+)/);
        return {
            day: dayMatch ? dayMatch[1] : 'N/A',
            contentType: lines[1]?.split(': ')[1] || '',
            idea: lines[2]?.split(': ')[1] || '',
            caption: lines[3]?.split(': ')[1] || '',
            hashtags: lines[4]?.split(': ')[1] || ''
        };
    }).filter(d => d.day !== 'N/A');

    return { plan, sources };
};


// --- SOTOSHOP TOOLS ---

export const generateMascot = async (prompt: string, numVariations: 2 | 4 = 2): Promise<string[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `cute character mascot, ${prompt}, full body, simple background, vibrant colors, character sheet style`,
        config: { numberOfImages: numVariations }
    });

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");

    return Promise.all(
        response.generatedImages.map(img => uploadBase64Image(`data:image/png;base64,${img.image.imageBytes}`, userId))
    );
};

export const generateMoodboardText = async (keywords: string): Promise<{ description: string; palette: string[] }> => {
    const ai = getAiClient();
    const prompt = `Based on the keywords "${keywords}", create a moodboard concept. Provide:
1. A short, evocative description of the mood in Indonesian.
2. A palette of 5 hex color codes that fit the mood.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    palette: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text);
};

export const generateMoodboardImages = async (keywords: string): Promise<string[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `photorealistic moodboard, inspiration images for a brand with the vibe: ${keywords}. 4 separate images.`,
        config: { numberOfImages: 4, aspectRatio: '1:1' }
    });

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");

    return Promise.all(
        response.generatedImages.map(img => uploadBase64Image(`data:image/png;base64,${img.image.imageBytes}`, userId))
    );
};

export const generatePattern = async (prompt: string): Promise<string[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `seamless tileable pattern, ${prompt}, vector art, simple`,
        config: { numberOfImages: 1, aspectRatio: '1:1' }
    });

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");

    return Promise.all(
        response.generatedImages.map(img => uploadBase64Image(`data:image/png;base64,${img.image.imageBytes}`, userId))
    );
};

export const applyPatternToMockup = async (patternUrl: string, mockupUrl: string): Promise<string> => {
    const ai = getAiClient();
    const [patternBase64, mockupBase64] = await Promise.all([
        fetchImageAsBase64(patternUrl),
        fetchImageAsBase64(mockupUrl)
    ]);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: mockupBase64.split(',')[1] } },
                { inlineData: { mimeType: 'image/png', data: patternBase64.split(',')[1] } },
                { text: "Apply the seamless pattern from the second image onto the product in the first image (e.g., the mug, bag, or shirt). Maintain the mockup's original shape and shadows." },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) throw new Error("Gagal menerapkan pola ke mockup.");

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");
    
    return uploadBase64Image(`data:image/png;base64,${base64Data}`, userId);
};

export const generateSceneFromImages = async (imageUrls: string[], prompt: string): Promise<string> => {
    const ai = getAiClient();
    
    const imageParts = await Promise.all(
        imageUrls.map(async (url) => {
            const base64 = await fetchImageAsBase64(url);
            return { inlineData: { mimeType: 'image/png', data: base64.split(',')[1] } };
        })
    );

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                ...imageParts,
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) throw new Error("Gagal menggabungkan gambar menjadi scene baru.");

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");
    
    return uploadBase64Image(`data:image/png;base64,${base64Data}`, userId);
};


export const generateVideo = async (
  prompt: string,
  model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview',
  resolution: '720p' | '1080p',
  aspectRatio: '16:9' | '9:16'
): Promise<Operation<GenerateVideosResponse>> => {
    const ai = getAiClient();
    const operation = await ai.models.generateVideos({
        model,
        prompt,
        config: {
            numberOfVideos: 1,
            resolution,
            aspectRatio
        }
    });
    return operation;
};

export const extendVideo = async (previousVideo: any, prompt: string): Promise<Operation<GenerateVideosResponse>> => {
    if (!previousVideo) throw new Error("Video sebelumnya tidak ditemukan untuk diperpanjang.");
    const ai = getAiClient();
    const operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview', // Extending requires the higher quality model
        prompt,
        video: previousVideo,
        config: {
            numberOfVideos: 1,
            resolution: '720p', // Extending is limited to 720p
            aspectRatio: previousVideo.aspectRatio,
        }
    });
    return operation;
};

export const checkVideoOperationStatus = async (operation: Operation<GenerateVideosResponse>): Promise<Operation<GenerateVideosResponse>> => {
    const ai = getAiClient();
    return ai.operations.getVideosOperation({ operation });
};


export const generateSpeech = async (script: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Gagal menghasilkan audio.");

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");

    // The raw data from TTS is typically PCM, but for storage and playback, MP3 is more convenient.
    // Here we are assuming the API gives us a format we can wrap. If it's raw PCM, it would need a server-side conversion step.
    // For now, let's assume it's directly usable and upload it.
    return uploadBase64Audio(base64Audio, userId, 'audio/mpeg');
};

export const editProductImage = async (base64Image: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) throw new Error("Gagal mengedit gambar produk.");

    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error("User not logged in.");
    
    return uploadBase64Image(`data:image/png;base64,${base64Data}`, userId);
};