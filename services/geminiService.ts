import { GoogleGenAI, Type, Modality } from "@google/genai";
import { createWhiteCanvasBase64, fetchImageAsBase64 } from '../utils/imageUtils';
import type { BrandInputs, BrandPersona, ContentCalendarEntry, LogoVariations, ProjectData, GeneratedCaption, SeoData, AdsData } from '../types';

// --- Environment Variable Setup ---
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
    if (errorString.includes("nggak ketemu, bro!")) {
        return new Error((error as Error).message);
    }
    
    // Pass through custom error messages from our own logic
    if (error instanceof Error && (error.message.includes("Model tidak mengembalikan gambar") || error.message.includes("tidak mengandung format"))) {
        return error;
    }

    return new Error(`Gagal manggil ${serviceName}. Coba cek console buat detailnya.`);
};

/**
 * Safely parses a JSON string. Throws a user-friendly error on failure.
 */
const safeJsonParse = <T>(jsonString: string, serviceName: string): T => {
  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error(`JSON Parse Error in ${serviceName}:`, parseError, "Raw string received:", jsonString);
    throw new Error(`Waduh, Mang AI lagi ngelindur. Respon dari ${serviceName} formatnya aneh dan nggak bisa dibaca. Coba generate ulang, ya.`);
  }
};

/**
 * Cleans a string to extract a valid JSON object or array.
 * It removes markdown code fences and trims surrounding text.
 * @param rawText The raw text response from the AI.
 * @param expectedType The expected root JSON type, either 'object' or 'array'.
 * @returns A clean JSON string.
 */
const cleanJsonString = (rawText: string, expectedType: 'object' | 'array' = 'array'): string => {
    let jsonString = rawText.trim();

    // Handle markdown code fences (```json ... ```)
    if (jsonString.startsWith('```') && jsonString.endsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
        if (jsonString.startsWith('json')) {
            jsonString = jsonString.substring(4).trim();
        }
    }

    const startChar = expectedType === 'array' ? '[' : '{';
    const endChar = expectedType === 'array' ? ']' : '}';

    const startIndex = jsonString.indexOf(startChar);
    const endIndex = jsonString.lastIndexOf(endChar);

    if (startIndex === -1 || endIndex === -1) {
        console.error(`Could not find a valid JSON ${expectedType} in the response.`, "Raw response:", rawText);
        throw new Error(`Respon dari Mang AI tidak mengandung format ${expectedType} yang valid.`);
    }

    return jsonString.substring(startIndex, endIndex + 1);
};


// --- NEW MASTER IMAGE GENERATION LOGIC ---

/**
 * Step 1: Enhance a simple prompt using the fast text model. Used for generic, non-logo images.
 */
const enhancePromptForImageGeneration = async (simplePrompt: string): Promise<string> => {
    const ai = getAiClient();
    const enhancementInstruction = `You are an expert prompt engineer for an AI image generator. Your task is to take a simple user request and expand it into a detailed, descriptive, and artistic prompt. The final image MUST be a simple, clean, flat vector illustration, NOT a photograph or a realistic mockup. Focus on style, colors, and composition.

User Request: "${simplePrompt}"

Enhanced Prompt:`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: enhancementInstruction,
            config: { temperature: 0.7 }
        });
        return response.text.trim();
    } catch (error) {
        console.warn("Prompt enhancement failed, using original prompt.", error);
        return simplePrompt; // Fallback to the original prompt
    }
};

/**
 * NEW Step 1 (Advanced): A sophisticated prompt engineering chain specifically for logos.
 */
const generateAdvancedLogoPrompt = async (logoRequestPrompt: string): Promise<string> => {
    const ai = getAiClient();
    const promptChainInstruction = `You are a world-class branding expert and AI prompt engineer collaborating on a logo design. Your task is to transform a basic user request into a sophisticated, detailed, and artistic prompt for an image generation model.

Follow these steps meticulously:

1.  **Deconstruct the Request**: Analyze the user's request: "${logoRequestPrompt}". Extract the core business, its persona keywords (e.g., minimalist, rustic, fun), and any key symbols mentioned.

2.  **Brainstorm Visual Concepts**: Based on your analysis, brainstorm 3 distinct visual concepts. Think metaphorically. For a coffee shop, instead of a simple coffee cup, you might suggest "a stylized sun rising from a coffee cup," "interlocking geometric shapes forming a coffee bean," or "a warm, hand-drawn illustration of a steam wisp forming an elegant letter."

3.  **Develop a Rich Descriptive Vocabulary**: For the best concept, create a list of evocative adjectives and nouns. Focus on artistic styles (e.g., art deco, geometric minimalism, neo-vintage), line quality (e.g., sharp vector lines, soft gradients, clean edges), and color theory (e.g., duotone color scheme, vibrant analogous colors, high contrast).

4.  **Synthesize the Final Prompt**: Combine the best ideas into a single, cohesive, and highly descriptive final prompt. The final prompt MUST be a masterpiece of visual direction. It MUST start with "masterpiece vector logo of...". It MUST specify "clean vector, minimalist, on a solid pure white background, #ffffff background". It must be EXTREMELY specific about shapes, lines, and colors. CRITICAL: ABSOLUTELY NO TEXT, WORDS, or LETTERS should be requested. Describe a symbolic, abstract icon only. The composition must be balanced, using negative space effectively, and centered.

**Final, Polished Prompt for Image Generation:**`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptChainInstruction,
            config: { temperature: 0.85 }
        });
        const cleanedPrompt = response.text.trim().replace(/^"|"$/g, '');
        return cleanedPrompt;
    } catch (error) {
        console.warn("Advanced prompt generation failed, falling back to simpler enhancement.", error);
        return await enhancePromptForImageGeneration(logoRequestPrompt);
    }
};

/**
 * Step 2: Generate an image on a white canvas using an enhanced prompt.
 */
const generateImageFromWhiteCanvas = async (prompt: string, aspectRatio: '1:1' | '4:3' | '16:9' | '9:16' | '3:4' = '1:1'): Promise<string> => {
    const ai = getAiClient();

    let width = 1024;
    let height = 1024;

    if (aspectRatio === '4:3') { width = 1024; height = 768; }
    else if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }
    else if (aspectRatio === '3:4') { width = 768; height = 1024; }

    const whiteCanvasBase64 = createWhiteCanvasBase64(width, height);
    const base64Data = whiteCanvasBase64.split(',')[1];
    const mimeType = 'image/png';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        const textResponse = response.text?.trim();
        if (textResponse) {
            console.error("Model did not return an image. Text response:", textResponse);
            throw new Error(`Model tidak mengembalikan gambar. Pesan dari AI: "${textResponse}"`);
        }
        throw new Error("Waduh, Mang AI gagal ngegambar. Model tidak mengembalikan gambar atau teks.");

    } catch (error) {
        console.error("Error in generateImageFromWhiteCanvas:", error);
        throw error;
    }
};

// --- Text Generation Functions ---
export const generateBrandPersona = async (businessName: string, industry: string, targetAudience: string, valueProposition: string): Promise<BrandPersona[]> => {
  const ai = getAiClient();
  const prompt = `Based on the following business details, create 3 distinct brand personas. Each persona should be a complete JSON object.
  
  Business Details:
  - Name: ${businessName}
  - Industry: ${industry}
  - Target Audience: ${targetAudience}
  - Value Proposition: ${valueProposition}

  For each persona, provide:
  1.  "nama_persona": A catchy name for the persona (e.g., "The Modern Minimalist", "The Playful Companion").
  2.  "deskripsi_singkat": A brief description of the brand's personality.
  3.  "kata_kunci": An array of 3-5 keywords that describe the brand's style.
  4.  "palet_warna_hex": An array of 5 hex color codes that match the persona.
  5.  "customer_avatars": An array of 2 customer avatars, each with:
      - "nama_avatar": A name for the customer segment.
      - "deskripsi_demografis": Their demographic description.
      - "pain_points": An array of their problems or needs.
      - "media_sosial": An array of social media platforms they use.
  6.  "brand_voice": An object describing the communication style, with:
      - "deskripsi": A description of the voice.
      - "kata_yang_digunakan": An array of words to use.
      - "kata_yang_dihindari": An array of words to avoid.
      
  Return an array of exactly 3 complete BrandPersona JSON objects.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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
                                required: ['nama_avatar', 'deskripsi_demografis', 'pain_points', 'media_sosial']
                            }
                        },
                        brand_voice: {
                            type: Type.OBJECT,
                            properties: {
                                deskripsi: { type: Type.STRING },
                                kata_yang_digunakan: { type: Type.ARRAY, items: { type: Type.STRING } },
                                kata_yang_dihindari: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                             required: ['deskripsi', 'kata_yang_digunakan', 'kata_yang_dihindari']
                        }
                    },
                     required: ['nama_persona', 'deskripsi_singkat', 'kata_kunci', 'palet_warna_hex', 'customer_avatars', 'brand_voice']
                }
            }
        },
    });
    
    const cleanedJson = cleanJsonString(response.text, 'array');
    return safeJsonParse<BrandPersona[]>(cleanedJson, 'generateBrandPersona');
  } catch (error) {
    throw handleApiError(error, "Brand Persona");
  }
};
export const generateSlogans = async (businessName: string, persona: BrandPersona, competitors: string): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `Create 5 short, catchy, and memorable slogans for a business named "${businessName}".

    Business Information:
    - Brand Persona: ${persona.nama_persona} (${persona.deskripsi_singkat})
    - Brand Voice Keywords: ${persona.brand_voice.kata_yang_digunakan.join(', ')}
    - Competitors: ${competitors}

    The slogans should align with the brand persona and be distinct from the competitors. Return a JSON array of 5 strings.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
        });
        const cleanedJson = cleanJsonString(response.text, 'array');
        return safeJsonParse<string[]>(cleanedJson, 'generateSlogans');
    } catch (error) {
        throw handleApiError(error, "Slogan");
    }
};
export const generateCaptions = async (businessName: string, persona: BrandPersona, topic: string, tone: string): Promise<GeneratedCaption[]> => {
    const ai = getAiClient();
    const prompt = `Create 3 social media captions for a business named "${businessName}".

    Business Information:
    - Brand Persona: ${persona.nama_persona} (${persona.deskripsi_singkat})
    - Brand Voice: Use words like "${persona.brand_voice.kata_yang_digunakan.join(', ')}" and avoid words like "${persona.brand_voice.kata_yang_dihindari.join(', ')}".

    Post Details:
    - Topic: ${topic}
    - Desired Tone: ${tone}

    For each of the 3 captions, provide a JSON object with:
    1. "caption": The social media caption text.
    2. "hashtags": An array of 5-7 relevant hashtags.

    Return a JSON array containing these 3 objects.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['caption', 'hashtags']
                    }
                }
            },
        });
        const cleanedJson = cleanJsonString(response.text, 'array');
        return safeJsonParse<GeneratedCaption[]>(cleanedJson, 'generateCaptions');
    } catch (error) {
        throw handleApiError(error, "Caption");
    }
};
export const generateContentCalendar = async (businessName: string, persona: BrandPersona): Promise<{ calendar: ContentCalendarEntry[], sources: any[] }> => {
    const ai = getAiClient();
    const prompt = `Create a 7-day social media content calendar for a business named "${businessName}".
    
    Business Information:
    - Brand Persona: ${persona.nama_persona} (${persona.deskripsi_singkat})
    - Brand Keywords: ${persona.kata_kunci.join(', ')}
    - Target Audience: ${persona.customer_avatars.map(a => a.deskripsi_demografis).join(', ')}

    For each day from "Senin" to "Minggu", provide a JSON object with:
    - "hari": The day of the week (e.g., "Senin").
    - "tipe_konten": The type of content (e.g., "Edukasi", "Promosi", "Interaksi").
    - "ide_konten": A concrete content idea.
    - "draf_caption": A draft caption for the post, written in the brand's voice.
    - "rekomendasi_hashtag": An array of 5 relevant hashtags.

    Return the result as a single JSON array containing exactly 7 objects, one for each day.
    Do not include any text or markdown formatting before or after the JSON array.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        const cleanedJson = cleanJsonString(response.text, 'array');
        const calendar = safeJsonParse<ContentCalendarEntry[]>(cleanedJson, 'generateContentCalendar');
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { calendar, sources };
    } catch (error) {
        throw handleApiError(error, "Content Calendar");
    }
};
export const generateSeoContent = async (brandInputs: BrandInputs): Promise<SeoData> => {
    const ai = getAiClient();
    const prompt = `Generate SEO content for a business with the following details:
    - Business Name: ${brandInputs.businessName}
    - Industry: ${brandInputs.industry}
    - Target Audience: ${brandInputs.targetAudience}
    - Value Proposition: ${brandInputs.valueProposition}

    Provide the following as a single JSON object:
    1. "keywords": An array of 10-15 relevant SEO keywords.
    2. "metaTitle": A compelling meta title for the website homepage (under 60 characters).
    3. "metaDescription": A concise meta description (under 160 characters).
    4. "gmbDescription": A friendly and informative description for a Google My Business profile (under 750 characters).`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        metaTitle: { type: Type.STRING },
                        metaDescription: { type: Type.STRING },
                        gmbDescription: { type: Type.STRING },
                    },
                    required: ['keywords', 'metaTitle', 'metaDescription', 'gmbDescription']
                }
            },
        });
        const cleanedJson = cleanJsonString(response.text, 'object');
        return safeJsonParse<SeoData>(cleanedJson, 'generateSeoContent');
    } catch (error) {
        throw handleApiError(error, "SEO Content");
    }
};
export const generateGoogleAdsContent = async (brandInputs: BrandInputs, slogan: string): Promise<AdsData> => {
    const ai = getAiClient();
    const prompt = `Generate 3 distinct Google Ads variations for a business.

    Business Details:
    - Name: ${brandInputs.businessName}
    - Slogan: ${slogan}
    - Value Proposition: ${brandInputs.valueProposition}
    - Target Audience: ${brandInputs.targetAudience}

    For each of the 3 ad variations, provide a JSON object with:
    - "headlines": An array of 3 short, punchy headlines (max 30 characters each).
    - "descriptions": An array of 2 compelling descriptions (max 90 characters each).
    - "keywords": An array of 5-7 relevant ad keywords.
    
    Return the result as a JSON array of these 3 ad objects.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                            descriptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['headlines', 'descriptions', 'keywords']
                    }
                }
            },
        });
        const cleanedJson = cleanJsonString(response.text, 'array');
        return safeJsonParse<AdsData>(cleanedJson, 'generateGoogleAdsContent');
    } catch (error) {
        throw handleApiError(error, "Google Ads");
    }
};


// --- REWRITTEN Image Generation Functions (Flash Preview ONLY) ---

export const generateLogoOptions = async (prompt: string): Promise<string[]> => {
    try {
        const advancedPrompt = await generateAdvancedLogoPrompt(prompt);
        // Generate 4 logo options in parallel for better user choice
        const promises = Array(4).fill(0).map(() => generateImageFromWhiteCanvas(advancedPrompt, '1:1'));
        const results = await Promise.all(promises);
        return results;
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Logo)");
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

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        const textResponse = response.text?.trim();
        if (textResponse) {
            console.error("Model did not return an image after edit. Text response:", textResponse);
            throw new Error(`Model tidak mengembalikan gambar. Pesan dari AI: "${textResponse}"`);
        }
        throw new Error("Model tidak mengembalikan gambar setelah diedit.");
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Edit Logo)");
    }
};

// FIX: Changed signature to take basePrompt first and generate variations from it, rather than editing an existing image.
export const generateLogoVariations = async (basePrompt: string): Promise<LogoVariations> => {
    try {
        // Create specific, direct instructions for image generation based on the original prompt
        const iconPrompt = `From the following logo concept, create a simplified icon-only version. Remove all text and lettering. Keep the core symbol or shape. The final output should be a clean vector icon on a solid white background. Concept: "${basePrompt}"`;
        const monochromePrompt = `Based on the following logo concept, create a high-contrast, monochrome (black and white) version. Do not change the shape or design elements, only remove all color. The final output must be a clean vector logo on a solid white background. Concept: "${basePrompt}"`;

        // Use the 'generateImageFromWhiteCanvas' function to perform the variations.
        const [iconResultBase64, monochromeResultBase64] = await Promise.all([
            generateImageFromWhiteCanvas(iconPrompt, '1:1'),
            generateImageFromWhiteCanvas(monochromePrompt, '1:1')
        ]);

        return { main: '', icon: iconResultBase64, monochrome: monochromeResultBase64 };
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Variasi Logo)");
    }
};

/**
 * A specialized function to generate a new image by applying a provided logo onto a new scene.
 * @param logoBase64 The Base64 string of the logo to apply.
 * @param instructionPrompt The text prompt describing the scene and how to place the logo.
 * @returns A promise that resolves with the Base64 data URL of the generated image.
 */
const generateImageWithLogo = async (logoBase64: string, instructionPrompt: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const logoData = logoBase64.split(',')[1];
        const logoMimeType = logoBase64.match(/data:(.*);base64/)?.[1] || 'image/png';

        const imagePart = { inlineData: { data: logoData, mimeType: logoMimeType } };
        const textPart = { text: instructionPrompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        const textResponse = response.text?.trim();
        if (textResponse) {
            throw new Error(`Model tidak mengembalikan gambar. Pesan dari AI: "${textResponse}"`);
        }
        throw new Error("Waduh, Mang AI gagal ngegambar. Model tidak mengembalikan gambar atau teks.");
    } catch (error) {
        console.error("Error in generateImageWithLogo:", error);
        throw error; // Re-throw to be handled by the calling function
    }
};


export const generateSocialMediaPostImage = async (idea: string, keywords: string[]): Promise<string[]> => {
    try {
        const simplePrompt = `A social media post about "${idea}". Style should be modern, clean, and related to these keywords: ${keywords.join(', ')}. simple flat vector illustration.`;
        const enhancedPrompt = await enhancePromptForImageGeneration(simplePrompt);
        const generatedBase64 = await generateImageFromWhiteCanvas(enhancedPrompt, '1:1');
        return [generatedBase64];
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Gambar Sosmed)");
    }
};

export const generatePrintMedia = async (
    mediaType: 'business_card' | 'flyer' | 'banner' | 'roll_banner',
    projectData: { brandInputs: BrandInputs; selectedPersona: BrandPersona; selectedLogoUrl: string }
): Promise<string[]> => {
    const { brandInputs, selectedPersona, selectedLogoUrl } = projectData;
    let instructionPrompt = '';

    try {
        // The logo URL is now a Base64 string, so no need to fetch it.
        const logoBase64 = selectedLogoUrl;

        switch (mediaType) {
            case 'business_card':
                instructionPrompt = `Take the provided logo image. Create a realistic mockup of a professional business card for "${brandInputs.businessName}". Place the logo appropriately. Add the following text information clearly: Name: ${brandInputs.contactInfo?.name}, Title: ${brandInputs.contactInfo?.title}, Phone: ${brandInputs.contactInfo?.phone}, Email: ${brandInputs.contactInfo?.email}, Website: ${brandInputs.contactInfo?.website}. The overall design should match the brand style: ${selectedPersona.nama_persona}.`;
                break;
            case 'flyer':
                instructionPrompt = `Take the provided logo image. Create a realistic mockup of a promotional A5 flyer for "${brandInputs.businessName}". Place the logo at the top. The headline is "${brandInputs.flyerContent?.headline}". The body text is "${brandInputs.flyerContent?.body}". The call to action is "${brandInputs.flyerContent?.cta}". The design style should be: ${selectedPersona.kata_kunci.join(', ')}.`;
                break;
            case 'banner':
                instructionPrompt = `Take the provided logo image. Create a realistic mockup of a large horizontal banner (spanduk) for "${brandInputs.businessName}". Place the logo on either the left or right side. The main headline is "${brandInputs.bannerContent?.headline}". The sub-headline is "${brandInputs.bannerContent?.subheadline}". The design style should be ${selectedPersona.nama_persona}.`;
                break;
            case 'roll_banner':
                instructionPrompt = `Take the provided logo image. Create a realistic mockup of a tall roll-up banner for "${brandInputs.businessName}". Place the logo near the top. The headline is "${brandInputs.rollBannerContent?.headline}". The body text is "${brandInputs.rollBannerContent?.body}". The contact info is "${brandInputs.rollBannerContent?.contact}".`;
                break;
        }

        const generatedBase64 = await generateImageWithLogo(logoBase64, instructionPrompt);
        return [generatedBase64];

    } catch (error) {
        throw handleApiError(error, `Flash Preview (${mediaType})`);
    }
};

export const generatePackagingDesign = async (prompt: string, logoUrl: string): Promise<string[]> => {
    try {
        // The logo URL is now a Base64 string, so no need to fetch it.
        const logoBase64 = logoUrl;
        const generatedBase64 = await generateImageWithLogo(logoBase64, prompt);
        return [generatedBase64];
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Kemasan)");
    }
};

export const generateMerchandiseMockup = async (prompt: string, logoUrl: string): Promise<string[]> => {
    try {
        // The logo URL is now a Base64 string, so no need to fetch it.
        const logoBase64 = logoUrl;
        const generatedBase64 = await generateImageWithLogo(logoBase64, prompt);
        return [generatedBase64];
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Merchandise)");
    }
};