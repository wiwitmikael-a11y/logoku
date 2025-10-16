// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { BrandInputs, BrandPersona, ContentCalendarEntry, GeneratedCaption, LogoVariations, SocialAdsData, SocialMediaKitAssets, SocialProfileData, ProjectData } from '../types';
import { fetchImageAsBase64, compressAndConvertToWebP } from "../utils/imageUtils";

let aiInstance: GoogleGenAI | null = null;

// FIX: Export getAiClient to make it accessible from other modules.
export const getAiClient = (): GoogleGenAI => {
  if (aiInstance) {
    return aiInstance;
  }
  
  const apiKey = process.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("Konfigurasi API Key Google Gemini (`VITE_API_KEY`) tidak ditemukan. Harap atur di environment variables.");
  }

  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};


// Helper to parse JSON safely from AI responses which might include markdown ```json
const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
    try {
        // Find the start and end of the JSON object/array
        const firstBracket = jsonString.indexOf('{');
        const lastBracket = jsonString.lastIndexOf('}');
        const firstSquare = jsonString.indexOf('[');
        const lastSquare = jsonString.lastIndexOf(']');
        
        let strToParse;

        if (firstSquare !== -1 && (firstSquare < firstBracket || firstBracket === -1)) {
            // It's an array
            strToParse = jsonString.substring(firstSquare, lastSquare + 1);
        } else if (firstBracket !== -1) {
            // It's an object
            strToParse = jsonString.substring(firstBracket, lastBracket + 1);
        } else {
            console.error("No valid JSON object or array found in string:", jsonString);
            return fallback;
        }

        return JSON.parse(strToParse);
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", e, "\nOriginal string:", jsonString);
        return fallback;
    }
};

export const generateBrandPersona = async (businessName: string, industry: string, targetAudience: string, valueProposition: string, competitorAnalysis: string | null): Promise<BrandPersona[]> => {
    const ai = getAiClient();
    const prompt = `Buat 3 persona brand unik untuk bisnis UMKM Indonesia.
- Nama Bisnis: "${businessName}"
- Industri/Bidang: ${industry}
- Target Audiens: ${targetAudience}
- Keunggulan (Value Proposition): ${valueProposition}
- Analisis Kompetitor (jika ada): ${competitorAnalysis || 'Tidak ada'}
- Brand voice harus jelas (contoh: formal, santai, humoris).
- Palet warna harus dalam format HEX.
- Customer avatar harus detail.
- Berikan nama persona yang kreatif dan deskriptif.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
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
                            },
                        },
                        brand_voice: {
                            type: Type.OBJECT,
                            properties: {
                                deskripsi: { type: Type.STRING },
                                kata_yang_digunakan: { type: Type.ARRAY, items: { type: Type.STRING } },
                                kata_yang_dihindari: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                        },
                    },
                },
            },
        },
    });

    return safeJsonParse(response.text, []);
};

export const generateSlogans = async (businessName: string, persona: BrandPersona, competitors: string): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `Buat 5 opsi slogan pendek, menarik, dan mudah diingat untuk bisnis bernama "${businessName}".
Persona Brand: ${persona.nama_persona} (${persona.deskripsi_singkat})
Kata Kunci Gaya: ${persona.kata_kunci.join(', ')}
Gaya Bicara: ${persona.brand_voice.deskripsi}
Hindari gaya slogan seperti kompetitor: ${competitors || 'Tidak ada'}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
    });
    return safeJsonParse(response.text, []);
};

export const analyzeCompetitorUrl = async (url: string, businessName: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Analisis URL kompetitor ini: ${url}. Berikan ringkasan singkat (1-2 paragraf) tentang kekuatan, kelemahan, dan gaya visual mereka. Analisis ini akan digunakan untuk membedakan brand baru bernama "${businessName}". Fokus pada aspek branding yang bisa ditiru atau dihindari.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateLogoOptions = async (prompt: string, style: string, businessName: string, count: number = 4): Promise<string[]> => {
    const ai = getAiClient();
    const fullPrompt = `logo ${style} untuk "${businessName}", dengan objek utama: ${prompt}. Bersih, vektor, di latar belakang putih polos.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: count,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        },
    });

    const base64Images = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    return Promise.all(base64Images.map(b64 => compressAndConvertToWebP(b64, 0.85)));
};

export const editLogo = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        const resultB64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return compressAndConvertToWebP(resultB64);
    }
    throw new Error("Gagal mengedit logo: tidak ada gambar yang dihasilkan.");
};

export const generateLogoVariations = async (baseLogoUrl: string, businessName: string): Promise<LogoVariations> => {
    const ai = getAiClient();
    const logoBase64 = baseLogoUrl.split(',')[1];
    const mimeType = baseLogoUrl.match(/data:(.*);base64/)?.[1] || 'image/png';

    const generateVariation = async (prompt: string): Promise<string> => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: logoBase64, mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
             const resultB64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             return compressAndConvertToWebP(resultB64);
        }
        throw new Error(`Gagal membuat variasi logo: ${prompt}`);
    };

    const [stacked, horizontal, monochrome] = await Promise.all([
        generateVariation(`Buat logo tumpuk (stacked) dengan teks "${businessName}" di bawah ikon. Gunakan font sans-serif modern. Latar belakang putih.`),
        generateVariation(`Buat logo datar (horizontal) dengan teks "${businessName}" di sebelah kanan ikon. Gunakan font sans-serif modern. Latar belakang putih.`),
        generateVariation(`Ubah logo ini menjadi versi monokrom (hitam putih solid). Pertahankan bentuk aslinya. Latar belakang putih.`),
    ]);

    return { main: baseLogoUrl, stacked, horizontal, monochrome };
};

export const generateSocialMediaKitAssets = async (projectData: ProjectData): Promise<SocialMediaKitAssets> => {
    const logoUrl = projectData.selectedLogoUrl;
    const persona = projectData.selectedPersona;
    
    const [profilePicture, banner] = await Promise.all([
        generateImageForCanvas(`Foto profil media sosial yang menarik menggunakan logo ini. Latar belakangnya harus menggunakan warna utama dari palet ini: ${persona.palet_warna_hex.join(', ')}. Gaya: ${persona.kata_kunci.join(', ')}.`, logoUrl),
        generateImageForCanvas(`Banner header media sosial (aspect ratio 16:9) yang menarik menggunakan logo ini. Desainnya harus abstrak dan minimalis, menggunakan palet warna: ${persona.palet_warna_hex.join(', ')}. Gaya: ${persona.kata_kunci.join(', ')}. Letakkan logo di tengah.`, logoUrl),
    ]);

    return { profilePictureUrl: profilePicture, bannerUrl: banner };
};

export const generateCaptions = async (businessName: string, persona: BrandPersona, topic: string, tone: string): Promise<GeneratedCaption[]> => {
    const ai = getAiClient();
    const prompt = `Buat 3 opsi caption media sosial untuk "${businessName}".
Persona Brand: ${persona.nama_persona}
Gaya Bicara: ${persona.brand_voice.deskripsi}
Topik Postingan: "${topic}"
Nada Bicara: ${tone}
Sertakan juga rekomendasi hashtag yang relevan untuk setiap caption.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        caption: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                },
            },
        },
    });

    return safeJsonParse(response.text, []);
};

export const generateSocialProfiles = async (inputs: BrandInputs, persona: BrandPersona): Promise<SocialProfileData> => {
    const ai = getAiClient();
    const prompt = `Buat teks profil untuk berbagai platform sosial media untuk bisnis "${inputs.businessName}".
Persona Brand: ${persona.nama_persona} (${persona.deskripsi_singkat}).
Gaya Bicara: ${persona.brand_voice.deskripsi}.
Target Audiens: ${inputs.targetAudience}.
Keunggulan: ${inputs.valueProposition}.
Buatkan untuk: bio Instagram (termasuk call to action), bio TikTok (lebih pendek dan catchy), dan deskripsi toko untuk Marketplace (Shopee/Tokopedia, lebih detail).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    instagramBio: { type: Type.STRING },
                    tiktokBio: { type: Type.STRING },
                    marketplaceDescription: { type: Type.STRING },
                },
            },
        },
    });

    return safeJsonParse(response.text, { instagramBio: '', tiktokBio: '', marketplaceDescription: '' });
};

export const generatePackagingDesign = async (prompt: string, logoBase64: string): Promise<string[]> => {
    const result = await generateImageForCanvas(prompt, `data:image/png;base64,${logoBase64}`);
    return [result];
};

export const generatePrintMedia = async (prompt: string, logoBase64: string): Promise<string[]> => {
     const result = await generateImageForCanvas(prompt, `data:image/png;base64,${logoBase64}`);
     return [result];
};

export const generateMerchandiseMockup = async (prompt: string, logoBase64: string): Promise<string[]> => {
     const result = await generateImageForCanvas(prompt, `data:image/png;base64,${logoBase64}`);
     return [result];
};

export const generateContentCalendar = async (businessName: string, persona: BrandPersona): Promise<{ calendar: ContentCalendarEntry[], sources: any[] }> => {
    const ai = getAiClient();
    const prompt = `Buat rencana konten media sosial untuk 7 hari ke depan untuk bisnis "${businessName}" dengan persona "${persona.nama_persona}".
Fokus pada topik yang relevan dengan ${persona.kata_kunci.join(', ')}.
Untuk setiap hari, berikan: hari, tipe konten (misal: Promosi, Edukasi, Interaksi), ide konten singkat, draf caption lengkap sesuai gaya bicara brand (${persona.brand_voice.deskripsi}), dan 5 rekomendasi hashtag.
Gunakan Google Search untuk mencari ide-ide yang sedang tren.
JAWAB HANYA DALAM FORMAT JSON.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const calendar = safeJsonParse<ContentCalendarEntry[]>(response.text, []);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { calendar, sources };
};

export const generateSocialAds = async (inputs: BrandInputs, persona: BrandPersona, slogan: string): Promise<SocialAdsData> => {
    const ai = getAiClient();
    const prompt = `Buat 2 set teks iklan (ad copy) untuk sosial media, satu untuk Instagram Ads, satu untuk TikTok Ads.
Bisnis: "${inputs.businessName}" (${inputs.businessDetail})
Target: ${inputs.targetAudience}
Persona: ${persona.nama_persona}
Gaya Bicara: ${persona.brand_voice.deskripsi}
Slogan: "${slogan}"
Keunggulan: ${inputs.valueProposition}
Sertakan juga 5-7 hashtag relevan untuk setiap platform.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING, enum: ["Instagram", "TikTok"] },
                        adCopy: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                },
            },
        },
    });

    return safeJsonParse(response.text, []);
};

export const generateSocialMediaPostImage = async (topic: string, keywords: string[]): Promise<string[]> => {
    const prompt = `Buat sebuah gambar ilustrasi yang menarik secara visual untuk postingan media sosial dengan topik: "${topic}". Gaya visualnya harus: ${keywords.join(', ')}, cerah, dan cocok untuk platform seperti Instagram.`;
    const result = await generateImageForCanvas(prompt);
    return [result];
};

export const moderateContent = async (content: string): Promise<{ isAppropriate: boolean; reason: string }> => {
    const ai = getAiClient();
    const prompt = `Analisis teks berikut dan tentukan apakah mengandung konten yang tidak pantas (SARA, ujaran kebencian, kekerasan, konten dewasa, spam). Jawab HANYA dengan format JSON {"isAppropriate": boolean, "reason": "alasan singkat jika tidak pantas"}. Teks: "${content}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return safeJsonParse(response.text, { isAppropriate: true, reason: "" });
};

// --- Video Generation ---
export const generateVideo = async (prompt: string, imageBase64?: string): Promise<any> => {
    const ai = getAiClient();
    let operation;
    if (imageBase64) {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            image: {
                imageBytes: imageBase64.split(',')[1],
                mimeType: imageBase64.match(/data:(.*);base64/)?.[1] || 'image/png',
            },
            config: { numberOfVideos: 1 }
        });
    } else {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            config: { numberOfVideos: 1 }
        });
    }
    return operation;
};

export const getVideosOperation = async (operation: any): Promise<any> => {
    const ai = getAiClient();
    return await ai.operations.getVideosOperation({ operation: operation });
};


// QuickTools Functions
export const generateBusinessNames = (category: string, keywords: string) => generateSlogans(category, { nama_persona: keywords } as BrandPersona, ''); // Re-use slogan gen logic
export const generateQuickSlogans = (businessName: string, keywords: string) => generateSlogans(businessName, { nama_persona: keywords } as BrandPersona, '');

export const generateMoodboardText = async (keywords: string): Promise<{ description: string; palette: string[] }> => {
    const ai = getAiClient();
    const prompt = `Buat deskripsi singkat (1 paragraf) untuk mood & feel dari sebuah brand dengan kata kunci: "${keywords}". Berikan juga 5 palet warna dalam format HEX yang cocok.`;
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
            },
        },
    });
    return safeJsonParse(response.text, { description: '', palette: [] });
};

export const generateMoodboardImages = async (keywords: string): Promise<string[]> => {
    const prompt = `4 gambar foto-realistis yang merepresentasikan vibe: ${keywords}.`;
    const results = await Promise.all(Array(4).fill(0).map(() => generateImageForCanvas(prompt)));
    return results;
};

export const generateSceneFromImages = async (base64Images: string[], prompt: string): Promise<string> => {
    const ai = getAiClient();
    const parts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[] = base64Images.map(b64 => ({
        inlineData: {
            data: b64.split(',')[1],
            mimeType: b64.match(/data:(.*);base64/)?.[1] || 'image/png'
        }
    }));
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        const resultB64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return compressAndConvertToWebP(resultB64);
    }
    throw new Error("Gagal menggabungkan gambar.");
};

export const generateImageForCanvas = async (prompt: string, baseImageB64?: string): Promise<string> => {
    const ai = getAiClient();
    const parts: ({ text: string; } | { inlineData: { data: string; mimeType: string; }; })[] = [{ text: prompt }];
    if (baseImageB64) {
        parts.unshift({
            inlineData: {
                data: baseImageB64.split(',')[1],
                mimeType: baseImageB64.match(/data:(.*);base64/)?.[1] || 'image/png',
            }
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        const resultB64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return compressAndConvertToWebP(resultB64);
    }
    throw new Error("Gagal membuat gambar.");
};

// Other functions from the codebase that need implementation
export const generateMissingField = async (currentInputs: Partial<BrandInputs>, fieldToGenerate: keyof BrandInputs): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Berdasarkan informasi brand ini: ${JSON.stringify(currentInputs)}, berikan satu saran untuk kolom yang hilang: "${fieldToGenerate}". Berikan jawaban singkat dan langsung pada intinya.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.replace(/["*]/g, '').trim();
};

export const applyPatternToMockup = async (patternB64: string, mockupB64: string): Promise<string> => {
    const prompt = "Terapkan pola dari gambar pertama ke area putih di gambar kedua (mockup).";
    const result = await generateImageForCanvas(prompt, patternB64);
    return compressAndConvertToWebP(result);
};

export const generateMascot = async (prompt: string, imageB64?: string): Promise<string[]> => {
    const ai = getAiClient();
    if (imageB64) {
        const fullPrompt = `Jadikan wajah di gambar ini sebagai inspirasi utama. Buat sebuah karakter maskot berdasarkan deskripsi ini: ${prompt}. Gaya ilustrasi vektor yang lucu dan modern, di latar belakang putih polos. Buat 2 variasi.`;
        // Since we need 2 variations, we can't use generateImageForCanvas which only returns one.
        // We will call the standard image model that can generate multiple.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ inlineData: { data: imageB64.split(',')[1], mimeType: imageB64.match(/data:(.*);base64/)?.[1] || 'image/png' } }, {text: fullPrompt}] }
        });
        // This model only returns one image, so we'll run it twice for now. A bit inefficient but works.
        const response2 = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ inlineData: { data: imageB64.split(',')[1], mimeType: imageB64.match(/data:(.*);base64/)?.[1] || 'image/png' } }, {text: fullPrompt}] }
        });
        const results = [];
        const part1 = response.candidates?.[0]?.content?.parts?.[0];
        if (part1?.inlineData) results.push(`data:${part1.inlineData.mimeType};base64,${part1.inlineData.data}`);
        const part2 = response2.candidates?.[0]?.content?.parts?.[0];
        if (part2?.inlineData) results.push(`data:${part2.inlineData.mimeType};base64,${part2.inlineData.data}`);
        if(results.length > 0) return Promise.all(results.map(r => compressAndConvertToWebP(r)));
        throw new Error("Gagal membuat maskot dari gambar.");
        
    } else {
        const fullPrompt = `Karakter maskot: ${prompt}. Gaya ilustrasi vektor yang lucu dan modern, di latar belakang putih polos. Buat 2 variasi.`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: { numberOfImages: 2, aspectRatio: '1:1', outputMimeType: 'image/png' },
        });
        const base64Images = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
        return Promise.all(base64Images.map(b64 => compressAndConvertToWebP(b64)));
    }
};


export const generateMascotPose = async (mascotB64: string, poseDescription: string): Promise<string> => {
    const prompt = `Ubah pose karakter di gambar ini menjadi: ${poseDescription}.`;
    return await generateImageForCanvas(prompt, mascotB64);
};

export const removeBackground = async (imageB64: string): Promise<string> => {
    const prompt = "Hapus total latar belakang gambar ini. Sisakan hanya objek utamanya. Latar belakang harus transparan.";
    return await generateImageForCanvas(prompt, imageB64);
};

export const generatePattern = async (prompt: string): Promise<string[]> => {
    const fullPrompt = `pola seamless (tanpa sambungan) dari: ${prompt}. gaya vektor datar.`;
    const result = await generateImageForCanvas(fullPrompt);
    return [result];
};

export const generateProductPhoto = async (productB64: string, scenePrompt: string): Promise<string> => {
    const prompt = `Hapus background gambar produk ini dan letakkan di suasana baru: ${scenePrompt}. Buat seperti foto produk komersial yang realistis.`;
    return await generateImageForCanvas(prompt, productB64);
};