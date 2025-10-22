// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, GenerateContentResponse, Modality, Type, Operation, GenerateVideosResponse } from "@google/genai";
import type { BrandInputs, BrandPersona, ProjectData } from '../types';
import { uploadBase64Image, uploadBase64Audio } from "./storageService";
import { getSupabaseClient } from "./supabaseClient";
import { fetchImageAsBase64 } from "../utils/imageUtils";

let ai: GoogleGenAI | null = null;
let vertexAi: GoogleGenAI | null = null;
let geminiApiKeyError: string | null = null;
let vertexApiKeyError: string | null = null;

// Inisialisasi Klien Gemini Standar
try {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API VITE_API_KEY tidak ditemukan di environment variables.");
  }
  ai = new GoogleGenAI({ apiKey });
} catch (e) {
  geminiApiKeyError = (e as Error).message;
}

// BARU: Inisialisasi Klien Khusus untuk Vertex AI (Veo)
try {
  const vertexApiKey = import.meta.env.VITE_VERTEX_API_KEY;
  if (!vertexApiKey) {
    throw new Error("Kunci API VITE_VERTEX_API_KEY untuk Vertex/Veo tidak ditemukan.");
  }
  vertexAi = new GoogleGenAI({ apiKey: vertexApiKey });
} catch (e) {
  vertexApiKeyError = (e as Error).message;
}

export const getAiClient = (): GoogleGenAI => {
    if (geminiApiKeyError) {
        throw new Error(geminiApiKeyError);
    }
    if (!ai) {
        throw new Error("Klien Gemini AI standar belum terinisialisasi. Cek konfigurasi VITE_API_KEY.");
    }
    return ai;
}

// BARU: Fungsi untuk mendapatkan klien Vertex AI
const getVertexAiClient = (): GoogleGenAI => {
    if (vertexApiKeyError) {
        throw new Error(vertexApiKeyError);
    }
    if (!vertexAi) {
        throw new Error("Klien Vertex AI belum terinisialisasi. Cek konfigurasi VITE_VERTEX_API_KEY.");
    }
    return vertexAi;
}


export const getApiKeyError = (): string | null => geminiApiKeyError || vertexApiKeyError;

// --- UTILITY ---
/**
 * Injects rich contextual details from the brand persona into a base prompt.
 * This function is key to maintaining high-quality output with cost-effective models.
 * @param prompt The base prompt for the AI.
 * @param persona The selected brand persona containing style guides.
 * @returns A supercharged, more detailed prompt.
 */
export const superchargePromptWithPersona = (prompt: string, persona: BrandPersona | null): string => {
  if (!persona) return prompt;
  
  const colorNames = persona.palet_warna.map(c => c.nama).join(', ');
  const personaContext = `
---
Panduan Gaya Wajib:
- Persona Brand: "${persona.nama_persona}"
- Gaya Visual: "${persona.visual_style}"
- Palet Warna Dominan: "${colorNames}"
- Nuansa/Mood: Ciptakan nuansa yang mencerminkan deskripsi persona: "${persona.deskripsi.substring(0, 100)}..."
Sesuaikan hasil akhir agar selaras dengan panduan gaya ini.
---
  `;
  
  return `${prompt}. ${personaContext}`;
};


// --- CORE BRANDING WORKFLOW ---

export const generateBrandPersonas = async (inputs: BrandInputs): Promise<BrandPersona[]> => {
    try {
        const ai = getAiClient(); // <- Tetap Pro untuk kualitas nalar terbaik
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
    } catch (error) {
        console.error("Gemini API Error in generateBrandPersonas:", error);
        throw new Error(`Gagal membuat persona brand. ${(error as Error).message}`);
    }
};


export const generateSlogans = async (inputs: BrandInputs): Promise<string[]> => {
    try {
        const ai = getAiClient(); // <- Flash sudah cukup
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
    } catch (error) {
        console.error("Gemini API Error in generateSlogans:", error);
        throw new Error(`Gagal membuat slogan. ${(error as Error).message}`);
    }
};

export const generateLogoPrompt = async (slogan: string, persona: BrandPersona): Promise<string> => {
    try {
        const ai = getAiClient(); // <- Flash sudah cukup
        const prompt = `Buat sebuah prompt deskriptif dalam Bahasa Inggris untuk AI image generator (seperti Imagen) untuk membuat logo. Prompt harus detail, fokus pada objek visual, dan mencerminkan esensi dari brand berikut:
- Slogan: "${slogan}"
- Persona Brand: ${persona.nama_persona}
- Gaya Visual: ${persona.visual_style}
- Deskripsi Persona: ${persona.deskripsi}
- Warna Dominan: ${persona.palet_warna.map(c => c.nama).join(', ')}

Prompt yang dihasilkan harus berupa satu paragraf detail, tanpa judul, dan fokus pada deskripsi visual logo yang diinginkan. Contoh output: "A minimalist and clean logo featuring a stylized geometric phoenix rising from a circuit board, vector art, vibrant orange and deep charcoal grey colors, suitable for a tech startup."`;
        
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error in generateLogoPrompt:", error);
        throw new Error(`Gagal membuat resep logo (prompt). ${(error as Error).message}`);
    }
};

export const generateLogoOptions = async (prompt: string, style: string = 'Vector'): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const fullPrompt = `logo, ${prompt}, ${style} style, simple, minimalist, clean background`;

        // REBALANCING: Generate 4 images in parallel using the more cost-effective model
        const imagePromises = Array(4).fill(0).map(() => 
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: fullPrompt }] },
                config: { responseModalities: [Modality.IMAGE] }
            })
        );
        const responses = await Promise.all(imagePromises);
        
        const base64DataArray = responses.map(response => 
            response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
        ).filter((data): data is string => !!data);

        if (base64DataArray.length < 4) console.warn("Could not generate all 4 logo options.");
        if (base64DataArray.length === 0) throw new Error("Gagal membuat opsi logo, tidak ada gambar yang dihasilkan oleh AI.");

        const supabase = getSupabaseClient();
        const userId = (await supabase.auth.getSession()).data.session?.user.id;
        if (!userId) throw new Error("User not logged in.");

        return Promise.all(
            base64DataArray.map(base64Data => uploadBase64Image(`data:image/png;base64,${base64Data}`, userId))
        );
    } catch (error) {
        console.error("Gemini API Error in generateLogoOptions:", error);
        throw new Error(`Gagal membuat opsi logo. ${(error as Error).message}`);
    }
};

export const editLogo = async (imageUrl: string, prompt: string): Promise<string> => {
    try {
        const ai = getAiClient(); // <- Flash Image adalah pilihan tepat
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
    } catch (error) {
        console.error("Gemini API Error in editLogo:", error);
        throw new Error(`Gagal merevisi logo. ${(error as Error).message}`);
    }
};


export const generateSocialMediaKitAssets = async (projectData: ProjectData): Promise<{ profilePictureUrl: string, bannerUrl: string }> => {
    try {
        const ai = getAiClient(); // <- Flash Image adalah pilihan tepat
        const { selectedLogoUrl, selectedPersona } = projectData;
        if (!selectedLogoUrl || !selectedPersona) throw new Error("Logo atau persona belum dipilih.");

        const basePrompt = `Gunakan logo yang diberikan sebagai dasar. Buat aset media sosial yang serasi.`;
        const superchargedPPPrompt = superchargePromptWithPersona(`${basePrompt} Buat sebuah foto profil (avatar) yang menarik.`, selectedPersona);
        const superchargedBannerPrompt = superchargePromptWithPersona(`${basePrompt} Buat sebuah banner/header untuk profil media sosial (e.g., Twitter, Facebook).`, selectedPersona);
        
        const [ppResponse, bannerResponse] = await Promise.all([
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { mimeType: 'image/png', data: selectedLogoUrl.split(',')[1] } }, { text: superchargedPPPrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            }),
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { mimeType: 'image/png', data: selectedLogoUrl.split(',')[1] } }, { text: superchargedBannerPrompt }] },
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
    } catch (error) {
        console.error("Gemini API Error in generateSocialMediaKitAssets:", error);
        throw new Error(`Gagal membuat aset visual sosmed. ${(error as Error).message}`);
    }
};

export const generateSocialProfiles = async (inputs: BrandInputs, persona: BrandPersona): Promise<{ instagramBio: string, tiktokBio: string, marketplaceDescription: string }> => {
    try {
        const ai = getAiClient(); // <- Flash sudah cukup
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
    } catch (error) {
        console.error("Gemini API Error in generateSocialProfiles:", error);
        throw new Error(`Gagal membuat teks profil. ${(error as Error).message}`);
    }
};


export const generateContentCalendar = async (inputs: BrandInputs, persona: BrandPersona): Promise<{ plan: any[], sources: any[] }> => {
    try {
        const ai = getAiClient(); // <- Tetap Pro untuk perencanaan berkualitas
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
    } catch (error) {
        console.error("Gemini API Error in generateContentCalendar:", error);
        throw new Error(`Gagal membuat kalender konten. ${(error as Error).message}`);
    }
};


// --- SOTOSHOP TOOLS ---

export const generateMascot = async (prompt: string, numVariations: 2 | 4 = 2, persona: BrandPersona | null): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const basePrompt = `cute character mascot, ${prompt}, full body, simple background, vibrant colors, character sheet style`;
        const fullPrompt = superchargePromptWithPersona(basePrompt, persona);

        // REBALANCING: Use cost-effective model
        const imagePromises = Array(numVariations).fill(0).map(() =>
             ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: fullPrompt }] },
                config: { responseModalities: [Modality.IMAGE] }
            })
        );
        const responses = await Promise.all(imagePromises);

        const base64DataArray = responses.map(response => 
            response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
        ).filter((data): data is string => !!data);

        if (base64DataArray.length < numVariations) console.warn(`Could not generate all ${numVariations} mascot variations.`);
        if (base64DataArray.length === 0) throw new Error("Gagal membuat maskot, tidak ada gambar yang dihasilkan.");

        const supabase = getSupabaseClient();
        const userId = (await supabase.auth.getSession()).data.session?.user.id;
        if (!userId) throw new Error("User not logged in.");

        return Promise.all(
            base64DataArray.map(base64Data => uploadBase64Image(`data:image/png;base64,${base64Data}`, userId))
        );
    } catch (error) {
        console.error("Gemini API Error in generateMascot:", error);
        throw new Error(`Gagal membuat maskot. ${(error as Error).message}`);
    }
};

export const generateMoodboardText = async (keywords: string): Promise<{ description: string; palette: string[] }> => {
    try {
        const ai = getAiClient(); // <- Flash sudah cukup
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
    } catch (error) {
        console.error("Gemini API Error in generateMoodboardText:", error);
        throw new Error(`Gagal membuat deskripsi moodboard. ${(error as Error).message}`);
    }
};

export const generateMoodboardImages = async (keywords: string, persona: BrandPersona | null): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const basePrompt = `photorealistic moodboard inspiration image for a brand with the vibe: ${keywords}.`;
        const fullPrompt = superchargePromptWithPersona(basePrompt, persona);
        
        // REBALANCING: Use cost-effective model, generate 4 images in parallel
        const imagePromises = Array(4).fill(0).map(() =>
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: fullPrompt }] },
                config: { responseModalities: [Modality.IMAGE] }
            })
        );
        const responses = await Promise.all(imagePromises);
        
        const base64DataArray = responses.map(response => 
            response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
        ).filter((data): data is string => !!data);
        
        if (base64DataArray.length < 4) console.warn("Could not generate all 4 moodboard images.");
        if (base64DataArray.length === 0) throw new Error("Gagal membuat gambar moodboard, tidak ada gambar yang dihasilkan.");

        const supabase = getSupabaseClient();
        const userId = (await supabase.auth.getSession()).data.session?.user.id;
        if (!userId) throw new Error("User not logged in.");

        return Promise.all(
            base64DataArray.map(base64Data => uploadBase64Image(`data:image/png;base64,${base64Data}`, userId))
        );
    } catch (error) {
        console.error("Gemini API Error in generateMoodboardImages:", error);
        throw new Error(`Gagal membuat gambar moodboard. ${(error as Error).message}`);
    }
};

export const generatePattern = async (prompt: string, persona: BrandPersona | null): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const basePrompt = `seamless tileable pattern, ${prompt}, vector art, simple`;
        const fullPrompt = superchargePromptWithPersona(basePrompt, persona);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: { responseModalities: [Modality.IMAGE] }
        });

        const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Data) throw new Error("Gagal membuat motif/pola, tidak ada gambar yang dihasilkan.");

        const supabase = getSupabaseClient();
        const userId = (await supabase.auth.getSession()).data.session?.user.id;
        if (!userId) throw new Error("User not logged in.");

        const url = await uploadBase64Image(`data:image/png;base64,${base64Data}`, userId);
        return [url];
    } catch (error) {
        console.error("Gemini API Error in generatePattern:", error);
        throw new Error(`Gagal membuat motif/pola. ${(error as Error).message}`);
    }
};

export const applyPatternToMockup = async (patternUrl: string, mockupUrl: string): Promise<string> => {
    try {
        const ai = getAiClient(); // <- Flash Image adalah pilihan tepat
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
    } catch (error) {
        console.error("Gemini API Error in applyPatternToMockup:", error);
        throw new Error(`Gagal menerapkan motif ke mockup. ${(error as Error).message}`);
    }
};

export const generateSceneFromImages = async (imageUrls: string[], prompt: string, persona: BrandPersona | null): Promise<string> => {
    try {
        const ai = getAiClient(); // <- Flash Image adalah pilihan tepat
        
        const imageParts = await Promise.all(
            imageUrls.map(async (url) => {
                const base64 = await fetchImageAsBase64(url);
                return { inlineData: { mimeType: 'image/png', data: base64.split(',')[1] } };
            })
        );
        
        const fullPrompt = superchargePromptWithPersona(prompt, persona);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    ...imageParts,
                    { text: fullPrompt },
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
    } catch (error) {
        console.error("Gemini API Error in generateSceneFromImages:", error);
        throw new Error(`Gagal menggabungkan gambar. ${(error as Error).message}`);
    }
};


// --- FUNGSI VIDEO (TETAP PREMIUM) ---
export const generateVideo = async (
  prompt: string,
  model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview',
  resolution: '720p' | '1080p',
  aspectRatio: '16:9' | '9:16'
): Promise<Operation<GenerateVideosResponse>> => {
    try {
        const ai = getVertexAiClient();
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
    } catch (error) {
        console.error("Gemini API Error in generateVideo:", error);
        throw new Error(`Gagal memulai pembuatan video. ${(error as Error).message}`);
    }
};

export const extendVideo = async (previousVideo: any, prompt: string): Promise<Operation<GenerateVideosResponse>> => {
    try {
        if (!previousVideo) throw new Error("Video sebelumnya tidak ditemukan untuk diperpanjang.");
        const ai = getVertexAiClient();
        const operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt,
            video: previousVideo,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: previousVideo.aspectRatio,
            }
        });
        return operation;
    } catch (error) {
        console.error("Gemini API Error in extendVideo:", error);
        throw new Error(`Gagal memperpanjang video. ${(error as Error).message}`);
    }
};

export const checkVideoOperationStatus = async (operation: Operation<GenerateVideosResponse>): Promise<Operation<GenerateVideosResponse>> => {
    try {
        const ai = getVertexAiClient();
        return ai.operations.getVideosOperation({ operation });
    } catch (error) {
        console.error("Gemini API Error in checkVideoOperationStatus:", error);
        throw new Error(`Gagal memeriksa status video. ${(error as Error).message}`);
    }
};


// --- FUNGSI LAIN (KEMBALI KE KLIEN STANDAR) ---
export const generateSpeech = async (script: string, voiceName: string = 'Kore'): Promise<string> => {
    try {
        const ai = getAiClient(); // <- Model TTS khusus
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Gagal menghasilkan audio.");

        const supabase = getSupabaseClient();
        const userId = (await supabase.auth.getSession()).data.session?.user.id;
        if (!userId) throw new Error("User not logged in.");

        return uploadBase64Audio(base64Audio, userId, 'audio/mpeg');
    } catch (error) {
        console.error("Gemini API Error in generateSpeech:", error);
        throw new Error(`Gagal menghasilkan suara. ${(error as Error).message}`);
    }
};

export const editProductImage = async (base64Image: string, prompt: string, persona: BrandPersona | null): Promise<string> => {
    try {
        const ai = getAiClient(); // <- Flash Image adalah pilihan tepat
        const fullPrompt = superchargePromptWithPersona(prompt, persona);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
                    { text: fullPrompt },
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
    } catch (error) {
        console.error("Gemini API Error in editProductImage:", error);
        throw new Error(`Gagal mengedit foto produk. ${(error as Error).message}`);
    }
};