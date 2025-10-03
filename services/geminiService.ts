// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { createWhiteCanvasBase64, fetchImageAsBase64 } from '../utils/imageUtils';
import type { BrandInputs, BrandPersona, ContentCalendarEntry, LogoVariations, ProjectData, GeneratedCaption, SocialProfileData, SocialAdsData, SocialMediaKitAssets } from '../types';

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
 * Simplified to remove cleanJsonString as responseSchema guarantees valid JSON.
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
 * Used for API calls that don't support responseSchema, like Google Search grounding.
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

3.  **Develop a Rich Descriptive Vocabulary**: For the best concept, create a list of evocative adjectives and nouns. Focus on artistic styles (e.g., flat icon design, art deco, geometric minimalism, neo-vintage), line quality (e.g., sharp vector lines, clean edges, line art), and color theory (e.g., duotone color scheme, vibrant analogous colors, high contrast). Think about design principles like 'logomark', 'symbol', 'abstract mark', 'negative space', and 'golden ratio'.

4.  **Synthesize the Final Prompt**: Combine the best ideas into a single, cohesive, and highly descriptive final prompt. This final prompt is for an award-winning design. It MUST start with "award-winning masterpiece vector logo of...". It must specify "clean vector, minimalist, on a solid pure white background, #ffffff background, trending on Dribbble". It must be EXTREMELY specific about shapes, lines, and colors. CRITICAL: The logo design should occupy about 70% of the canvas to ensure it is prominent and not too small. ABSOLUTELY NO TEXT, WORDS, or LETTERS should be requested. Describe a symbolic, abstract icon only. The composition must be balanced, centered, and visually stunning, suitable for a modern brand identity.

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
 * Step 1.5: Generates multiple variations of a master prompt to ensure diverse image outputs.
 */
const generateMultipleLogoPrompts = async (basePrompt: string, count: number): Promise<string[]> => {
    const ai = getAiClient();
    const instruction = `Based on the following polished and detailed logo prompt, generate ${count} distinct variations of it. Each variation should explore a slightly different artistic direction, composition, or metaphorical concept while staying true to the core request. Ensure each prompt is a complete, standalone masterpiece prompt, starting with "award-winning masterpiece vector logo of..." and specifying "clean vector, minimalist, on a solid pure white background, #ffffff background, trending on Dribbble".

    Base Prompt: "${basePrompt}"

    Return a JSON array of ${count} unique prompt strings.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: instruction,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
        });
        const prompts = safeJsonParse<string[]>(response.text, 'generateMultipleLogoPrompts');
        if (prompts.length !== count) {
            console.warn(`Expected ${count} prompts, but got ${prompts.length}. Falling back to repeating base prompt.`);
            return Array(count).fill(basePrompt);
        }
        return prompts;
    } catch (error) {
        console.warn("Failed to generate prompt variations, using original prompt.", error);
        // Fallback: repeat the original advanced prompt 'count' times
        return Array(count).fill(basePrompt);
    }
};


/**
 * Step 2: Generate an image on a white canvas using an enhanced prompt.
 */
const generateImageFromWhiteCanvas = async (prompt: string, aspectRatio: '1:1' | '4:3' | '16:9' | '9:16' | '3:4' | '3:1' = '1:1'): Promise<string> => {
    const ai = getAiClient();

    let width = 1024;
    let height = 1024;

    if (aspectRatio === '4:3') { width = 1024; height = 768; }
    else if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }
    else if (aspectRatio === '3:4') { width = 768; height = 1024; }
    else if (aspectRatio === '3:1') { width = 1536; height = 512; }

    const whiteCanvasBase64 = createWhiteCanvasBase64(width, height);
    const base64Data = whiteCanvasBase64.split(',')[1];
    const mimeType = 'image/png';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
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
    
    return safeJsonParse<BrandPersona[]>(response.text, 'generateBrandPersona');
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
        return safeJsonParse<string[]>(response.text, 'generateSlogans');
    } catch (error) {
        throw handleApiError(error, "Slogan");
    }
};

export const generateQuickSlogans = async (businessName: string, keywords: string): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `Act as a creative branding expert for Indonesian small businesses (UMKM). Generate 10 short, catchy, and memorable slogans.

    Business Details:
    - Business Name: ${businessName}
    - Keywords/Vibe (optional): ${keywords || 'tidak ada'}

    The slogans should be a mix of:
    - Indonesian and English.
    - Modern, punchy, and easy to remember.
    - Suitable for social media and marketing.

    Return a single JSON array of 10 strings.`;
    
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
        return safeJsonParse<string[]>(response.text, 'generateQuickSlogans');
    } catch (error) {
        throw handleApiError(error, "Slogan Generator");
    }
};

// NEW: For Quick Tools
export const generateBusinessNames = async (category: string, keywords: string): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `Act as a creative branding expert for Indonesian small businesses (UMKM). Generate 15 unique, catchy, and modern business name ideas.

    Business Details:
    - Product/Service: ${category}
    - Keywords/Vibe (optional): ${keywords || 'tidak ada'}

    The names should be a mix of:
    - Indonesian words (modern, slang, or traditional).
    - English words that are easy for Indonesians to pronounce.
    - Creative combinations of both.
    - Avoid generic names. Aim for names that are memorable and brandable.

    Return a single JSON array of 15 strings.`;
    
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
        return safeJsonParse<string[]>(response.text, 'generateBusinessNames');
    } catch (error) {
        throw handleApiError(error, "Business Name Generator");
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
        return safeJsonParse<GeneratedCaption[]>(response.text, 'generateCaptions');
    } catch (error) {
        throw handleApiError(error, "Caption");
    }
};
export const generateContentCalendar = async (businessName: string, persona: BrandPersona): Promise<{ calendar: ContentCalendarEntry[], sources: any[] }> => {
    const ai = getAiClient();
    const prompt = `Act as a creative and savvy social media manager for an Indonesian small business (UMKM). Your task is to create a highly engaging 7-day content calendar for a business named "${businessName}". Use Google Search to find current trends and relevant topics in Indonesia for this industry.

    Business Profile:
    - Brand Persona: "${persona.nama_persona}" which is described as "${persona.deskripsi_singkat}".
    - Keywords: ${persona.kata_kunci.join(', ')}.
    - Target Audience in Indonesia: ${persona.customer_avatars.map(a => a.deskripsi_demografis).join(', ')}.
    - Brand Voice: Use words like "${persona.brand_voice.kata_yang_digunakan.join(', ')}" and avoid "${persona.brand_voice.kata_yang_dihindari.join(', ')}".

    For each day from "Senin" to "Minggu", generate creative and actionable ideas. Go beyond simple promotions. Include a mix of content types like:
    - **Edukasi**: Tips, tricks, or fun facts related to the product/service.
    - **Inspirasi**: Quotes or stories that align with the brand.
    - **Behind the Scenes**: Show the making-of process, the team, or the workspace.
    - **Interaksi**: Ask questions, create polls, or run a simple quiz.
    - **User-Generated Content (UGC)**: Encourage customers to share their photos with a specific hashtag.
    - **Promosi Kreatif**: Announce offers in a fun, non-hard-sell way.
    - **Hiburan**: Memes, jokes, or content that is simply entertaining and relevant.

    Return a single JSON array of exactly 7 objects. Each object must contain:
    - "hari": The day of the week (e.g., "Senin").
    - "tipe_konten": The creative content type you chose (e.g., "Behind the Scenes").
    - "ide_konten": A specific and engaging content idea based on the type.
    - "draf_caption": A compelling draft caption in the correct brand voice, including a call-to-action.
    - "rekomendasi_hashtag": An array of 5-7 relevant and trending hashtags.`;

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
// --- REWRITTEN Image Generation Functions (Flash Preview ONLY) ---

export const generateLogoOptions = async (prompt: string, count: number = 4): Promise<string[]> => {
    try {
        const advancedPrompt = await generateAdvancedLogoPrompt(prompt);
        // Generate varied prompts for more distinct logo options
        const variedPrompts = await generateMultipleLogoPrompts(advancedPrompt, count);
        
        const promises = variedPrompts.map(p => generateImageFromWhiteCanvas(p, '1:1'));
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
            model: 'gemini-2.5-flash-image',
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

export const generateLogoVariations = async (baseLogoBase64: string, businessName: string): Promise<LogoVariations> => {
    try {
        const base64Data = baseLogoBase64.split(',')[1];
        const mimeType = baseLogoBase64.match(/data:(.*);base64/)?.[1] || 'image/png';
        
        // Step 1: Generate stacked and horizontal versions from the main icon
        const stackedPrompt = `Take the provided logo icon. Place the brand name "${businessName}" cleanly below the icon. Use a modern, legible sans-serif font that perfectly complements the logo's style. The entire composition should be centered and balanced. The final output must be a clean vector logo on a solid white background. Ensure the text is spelled correctly.`;
        const horizontalPrompt = `Take the provided logo icon. Place the brand name "${businessName}" cleanly to the right of the icon. Vertically align the icon and the text in the middle. Use a modern, legible sans-serif font that matches the logo's style. The whole design must be balanced. The final output must be a clean vector logo on a solid white background. Ensure the text is spelled correctly.`;

        const [stackedResultBase64, horizontalResultBase64] = await Promise.all([
            editLogo(base64Data, mimeType, stackedPrompt),
            editLogo(base64Data, mimeType, horizontalPrompt)
        ]);
        
        // Step 2: Generate the monochrome version from the horizontal logo (which now includes text)
        const horizontalResultData = horizontalResultBase64.split(',')[1];
        const horizontalMimeType = horizontalResultBase64.match(/data:(.*);base64/)?.[1] || 'image/png';
        const monochromePrompt = `Take the provided logo image (which already includes text). Convert the entire design into a high-contrast, monochrome (black and white) version. Do not change the shape or layout, only remove all color. The final output must be a clean vector logo on a solid white background.`;

        const monochromeResultBase64 = await editLogo(horizontalResultData, horizontalMimeType, monochromePrompt);

        return { 
            main: baseLogoBase64, 
            stacked: stackedResultBase64, 
            horizontal: horizontalResultBase64, 
            monochrome: monochromeResultBase64 
        };
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
            model: 'gemini-2.5-flash-image',
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

export const generatePackagingDesign = async (prompt: string, logoBase64: string): Promise<string[]> => {
    try {
        const generatedBase64 = await generateImageWithLogo(logoBase64, prompt);
        return [generatedBase64];
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Kemasan)");
    }
};

export const generatePrintMedia = async (prompt: string, logoBase64: string): Promise<string[]> => {
    try {
        // This is a simplified version. A more complex one could generate a blank canvas first.
        // For now, we rely on prompt engineering to get the desired aspect ratio.
        const generatedBase64 = await generateImageWithLogo(logoBase64, prompt);
        return [generatedBase64];
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Media Cetak)");
    }
};

export const generateMerchandiseMockup = async (prompt: string, logoBase64: string): Promise<string[]> => {
    try {
        const generatedBase64 = await generateImageWithLogo(logoBase64, prompt);
        return [generatedBase64];
    } catch (error) {
        throw handleApiError(error, "Flash Preview (Merchandise)");
    }
};

// --- NEW Social Media Centric Functions ---
export const generateSocialProfiles = async (brandInputs: BrandInputs, persona: BrandPersona): Promise<SocialProfileData> => {
    const ai = getAiClient();
    const prompt = `Generate social media and marketplace profiles for a business.

    Business Details:
    - Name: ${brandInputs.businessName}
    - Persona: ${persona.nama_persona} (${persona.deskripsi_singkat})
    - Value Proposition: ${brandInputs.valueProposition}

    Provide the following as a single JSON object:
    1. "instagramBio": A compelling Instagram bio (under 150 characters), including a call-to-action.
    2. "tiktokBio": A short and punchy TikTok bio (under 80 characters).
    3. "marketplaceDescription": A persuasive and detailed store description for platforms like Shopee or Tokopedia.
    
    Ensure the tone matches the brand persona.`;
    
    try {
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
                    required: ['instagramBio', 'tiktokBio', 'marketplaceDescription']
                }
            },
        });
        return safeJsonParse<SocialProfileData>(response.text, 'generateSocialProfiles');
    } catch (error) {
        throw handleApiError(error, "Social Profiles");
    }
};
export const generateSocialAds = async (brandInputs: BrandInputs, persona: BrandPersona, slogan: string): Promise<SocialAdsData> => {
    const ai = getAiClient();
    const prompt = `Generate 2 distinct social media ad variations for a business.

    Business Details:
    - Name: ${brandInputs.businessName}
    - Slogan: ${slogan}
    - Value Proposition: ${brandInputs.valueProposition}
    - Brand Persona: ${persona.nama_persona} (${persona.deskripsi_singkat})

    For each ad, create a version for Instagram and one for TikTok. Provide a JSON object for each with:
    - "platform": "Instagram" or "TikTok".
    - "adCopy": Compelling ad copy suitable for the platform's format and audience.
    - "hashtags": An array of 5-7 relevant hashtags.
    
    Return the result as a JSON array of these 2 ad objects.`;
    
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
                            platform: { type: Type.STRING },
                            adCopy: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['platform', 'adCopy', 'hashtags']
                    }
                }
            },
        });
        return safeJsonParse<SocialAdsData>(response.text, 'generateSocialAds');
    } catch (error) {
        throw handleApiError(error, "Social Ads");
    }
};

export const generateSocialMediaKitAssets = async (
    projectData: ProjectData
): Promise<SocialMediaKitAssets> => {
    const { selectedLogoUrl, selectedPersona, brandInputs, selectedSlogan, logoVariations } = projectData;
    
    try {
        const primaryColor = selectedPersona.palet_warna_hex[0] || '#6366f1';

        // --- Profile Picture Generation (uses main icon) ---
        const profilePicBase64 = await fetchImageAsBase64(selectedLogoUrl);
        const profilePicPrompt = `Take the provided logo image. Place this logo perfectly centered on a solid color background. The background color should be exactly this hex code: ${primaryColor}. The final output should be a clean, square profile picture.`;
        const generatedProfilePicPromise = generateImageWithLogo(profilePicBase64, profilePicPrompt);

        // --- Banner Generation (uses horizontal logo if available) ---
        const useHorizontalLogo = logoVariations && logoVariations.horizontal;
        const bannerLogoUrl = useHorizontalLogo ? logoVariations.horizontal : selectedLogoUrl;
        const bannerLogoBase64 = await fetchImageAsBase64(bannerLogoUrl);

        let bannerPrompt: string;
        if (useHorizontalLogo) {
            // If the horizontal logo (with text) is used, just place it.
            bannerPrompt = `Take the provided logo image (which is a complete logo with icon and text). Create a simple and clean Facebook banner (16:9 aspect ratio). The background should be a solid color, using this hex code: ${primaryColor}. Place the logo on the left or right side, leaving ample empty space. CRITICAL: DO NOT add any more text.`;
        } else {
            // If only the main icon is available, add text.
            bannerPrompt = `Take the provided logo image (icon only). Create a simple and clean Facebook banner (16:9 aspect ratio). The background should be a solid color, using this hex code: ${primaryColor}. Place the logo on the left or right side. Then, add the business name "${brandInputs.businessName}" and the slogan "${selectedSlogan}" in a clean, legible font. Ensure all text is spelled correctly.`;
        }
        const generatedBannerPromise = generateImageWithLogo(bannerLogoBase64, bannerPrompt);

        const [profilePictureUrl, bannerUrl] = await Promise.all([
            generatedProfilePicPromise,
            generatedBannerPromise
        ]);
        
        return { profilePictureUrl, bannerUrl };

    } catch (error) {
        throw handleApiError(error, `Flash Preview (Social Media Kit)`);
    }
};