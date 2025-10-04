// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { createWhiteCanvasBase64, fetchImageAsBase64, applyWatermark } from '../utils/imageUtils';
// FIX: The import for types was failing because types.ts was not a module. This is fixed by adding content to types.ts
import type { BrandInputs, BrandPersona, ContentCalendarEntry, LogoVariations, ProjectData, GeneratedCaption, SocialProfileData, SocialAdsData, SocialMediaKitAssets, AIPetState, AIPetPersonalityVector, AIPetStats, AtlasManifest } from '../types';

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
                const watermarkedImage = await applyWatermark(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                return watermarkedImage;
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

// --- NEW 2.5D AIPET GENERATION SYSTEM ---

export const generateAIPetAtlasAndManifest = async (userId: string): Promise<{ atlasUrl: string, manifest: AtlasManifest }> => {
    const ai = getAiClient();
    
    // --- Step 1: Generate the Character Atlas (Sprite Sheet) ---
    const seed = userId + new Date().toISOString().slice(0, 10);
    const atlasPrompt = `Create a flawless character rigging kit (sprite sheet) for a unique baby digital pet, suitable for 2.5D puppet animation.

    **AESTHETIC STYLE (CRUCIAL):**
    The aesthetic is 'AIPet': a fusion of a cute **animalistic creature (Pet)** and sleek mechanical parts (AI). The final form MUST be a **NON-HUMANOID mechanical animal or monster**. Think 'chibi-mecha beast', 'biomechanical creature', or a cute monster with integrated futuristic armor. It should be endearing but also look powerful and cool. **ABSOLUTELY NO humanoid, robotic, android, or Iron Man-like figures.** The style is clean, sharp vector art with consistent lighting from the top-left.

    **GLOBAL RULES (ABSOLUTELY CRITICAL):**
    1.  **SOLID TRANSPARENT BACKGROUND:** The final PNG must have a fully transparent background. No white, no colors, no frames. **NON-NEGOTIABLE: ABSOLUTELY NO checkered or checkerboard patterns.** The background must be 100% transparent. This is the most important rule.
    2.  **CONSISTENT ORIENTATION:** All body parts MUST be drawn from a **2.5D isometric perspective as if the character is facing to the LEFT**. This uniformity is critical.
    3.  **PERFECT, UNCOMPROMISING SEPARATION (MOST IMPORTANT RULE):** This is the most critical instruction. Each of the 7 parts MUST be a completely separate, distinct, and standalone object on the sprite sheet. There must be **large amounts of empty, transparent space** between every part. **NO part should touch, overlap, or be connected to another part in any way.** The AI must generate 7 individual, fully detached pieces. Failure to do this makes the output useless. The torso MUST NOT have arms attached, the head MUST NOT have the torso attached, etc.
    4.  **NO TEXT OR BORDERS:** The image must only contain the 7 specified body parts.

    **REQUIRED BODY PARTS (7 INDIVIDUAL, SEPARATED PIECES):**
    1.  **Head:** A single, complete, fully detached head. It must NOT have any part of the torso attached.
    2.  **Torso:** A single, complete, fully detached torso. It is the central body piece. It MUST NOT have any head, arms, or legs attached to it whatsoever.
    3.  **Left Arm:** A complete, fully detached left arm (or forelimb), from the shoulder joint to the paw/claw/hand. It must be one single, separate piece.
    4.  **Right Arm:** A complete, fully detached right arm (or forelimb), from the shoulder joint to the paw/claw/hand. It must be one single, separate piece.
    5.  **Left Leg:** A complete, fully detached left leg (or hindlimb), from the hip joint to the foot. It must be one single, separate piece.
    6.  **Right Leg:** A complete, fully detached right leg (or hindlimb), from the hip joint to the foot. It must be one single, separate piece.
    7.  **Accessory:** One unique accessory (like a small mechanical wing, a floating data halo, or a cybernetic tail). It must be a single, separate piece.

    Arrange these 7 perfectly separated parts neatly in a grid. This is for a professional animation pipeline, so precision is key.
    Seed: ${seed}`;

    let initialAtlasUrl: string;
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: atlasPrompt,
            config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
        });
        initialAtlasUrl = `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
    } catch (error) {
        throw handleApiError(error, "AIPet Atlas Generation (Stage 1)");
    }

    // --- Step 1.5: AI-Powered Background Cleanup ---
    // This step ensures perfect transparency, fixing issues like checkerboard backgrounds.
    let cleanedAtlasUrl: string;
    try {
        cleanedAtlasUrl = await removeImageBackground(initialAtlasUrl);
    } catch (error) {
        console.warn("AI background cleanup failed, attempting to use original atlas.", error);
        cleanedAtlasUrl = initialAtlasUrl; // Fallback to the original if cleanup fails
    }

    // --- Step 2: Analyze the Cleaned Atlas and Generate the Assembly Manifest JSON ---
    const atlasBase64Data = cleanedAtlasUrl.split(',')[1];
    const manifestPrompt = `Analyze the provided character atlas image. It contains 7 separated parts of a creature. Identify each part (head, torso, left_arm, right_arm, left_leg, right_leg, accessory1) and provide a complete JSON manifest for reassembling it.

    **JSON Output Instructions:**
    - "atlasSize": The [width, height] of the entire image.
    - "parts": An array of objects for each part. Each object must have:
        - "name": The part name (e.g., "head").
        - "bbox": The bounding box [x, y, width, height] of the part.
        - "assemblyPoint": The part's own joint point [x, y], relative to its bbox. For arms/legs, this is the shoulder/hip. For the head, this is the neck.
        - "attachTo": The name of the parent part (e.g., "left_arm" attaches to "torso"). The torso's 'attachTo' is null.
        - "attachmentPoint": The named anchor on the parent (e.g., "left_shoulder"). The torso's 'attachmentPoint' is null.
    - "anchors": An object mapping parts that have attachment points (mainly the 'torso') to their named anchor locations [x, y] relative to their bbox. The torso MUST have 'neck', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'.
    - "layering": An array of part names in the correct z-index order for a 2.5D isometric view (from back to front). A good default is: ['right_leg', 'left_leg', 'right_arm', 'torso', 'left_arm', 'head']. Place the accessory where it makes sense.`;
    
    const manifestSchema = {
        type: Type.OBJECT,
        properties: {
            atlasSize: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "The [width, height] of the entire atlas image." },
            parts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Part name (e.g., 'head', 'torso')." },
                        bbox: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Bounding box [x, y, width, height]." },
                        assemblyPoint: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Joint point [x, y] relative to bbox." },
                        attachTo: { type: Type.STRING, description: "Parent part name to attach to. Can be null for the root part." },
                        attachmentPoint: { type: Type.STRING, description: "Anchor name on parent. Can be null for the root part." }
                    },
                    required: ['name', 'bbox', 'assemblyPoint', 'attachTo', 'attachmentPoint']
                }
            },
            anchors: {
                type: Type.OBJECT,
                description: "Maps parts to their anchor points. Primarily for the 'torso'.",
                properties: {
                    torso: {
                        type: Type.OBJECT,
                        description: "Anchor points on the torso.",
                        properties: {
                            neck: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            left_shoulder: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            right_shoulder: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            left_hip: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            right_hip: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            accessory_mount1: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            accessory_mount2: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        }
                    },
                }
            },
            layering: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Z-index order of parts from back to front." }
        },
        required: ['atlasSize', 'parts', 'anchors', 'layering']
    };


    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { data: atlasBase64Data, mimeType: 'image/png' } }, { text: manifestPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: manifestSchema
            }
        });
        const manifest = safeJsonParse<AtlasManifest>(response.text, 'AIPet Manifest Generation');
        return { atlasUrl: cleanedAtlasUrl, manifest };
    } catch (error) {
        throw handleApiError(error, "AIPet Manifest Generation (Stage 2)");
    }
};

/** @deprecated Replaced by generateAIPetAtlasAndManifest */
export const DEPRECATED_generateAIPetVisual = async (userId: string): Promise<string> => {
    // [CODE OMITTED FOR BREVITY - The old logic remains here but is no longer called]
    return "";
};


export const generateAIPetNarrative = async (petData: { name: string, personality: AIPetPersonalityVector, stats: AIPetStats }): Promise<string> => {
    const ai = getAiClient();
    
    const sortedPersonality = Object.entries(petData.personality).sort(([, a], [, b]) => b - a);
    const dominantTrait = sortedPersonality[0][0];
    const sortedStats = Object.entries(petData.stats).sort(([, a], [, b]) => b - a);
    const dominantStat = sortedStats[0][0];

    const prompt = `You are a creative writer for a digital monster game like Pokémon or Digimon. Write a short, evocative, "Pokédex-style" entry for a new creature. The entry should be 2-3 sentences.

    Creature Details:
    - Name: ${petData.name}
    - Dominant Personality Trait: ${dominantTrait}
    - Strongest Stat: ${dominantStat}

    Write the entry in Bahasa Indonesia, with a slightly mysterious and intriguing tone.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.8 }
        });
        return response.text.trim();
    } catch (error) {
        throw handleApiError(error, "AI Pet Narrative Generator");
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

// NEW: For Moodboard Generator in Quick Tools
export const generateMoodboardText = async (keywords: string): Promise<{ description: string; palette: string[] }> => {
    const ai = getAiClient();
    const prompt = `Act as a senior brand strategist. Based on the following keywords, create a brand moodboard concept.

    Keywords: "${keywords}"

    Your task is to provide:
    1.  A short, evocative paragraph describing the brand's mood and feeling.
    2.  A perfectly matching color palette of 5 hex codes.

    Return a single JSON object with two keys: "description" (a string) and "palette" (an array of 5 hex strings).`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['description', 'palette']
                }
            },
        });
        return safeJsonParse<{ description: string; palette: string[] }>(response.text, 'generateMoodboardText');
    } catch (error) {
        throw handleApiError(error, "Moodboard Text Generator");
    }
};

export const generateMoodboardImages = async (keywords: string): Promise<string[]> => {
    const ai = getAiClient();
    // Step 1: Create a master prompt for the image generator
    const imagePromptInstruction = `Based on the keywords "${keywords}", create a single, highly detailed, and artistic prompt for an AI image generator to create 4 thematically cohesive images for a moodboard. The prompt should describe a scene, texture, style, and color palette. For example: "A moodboard of a rustic coffee shop at sunset, featuring warm tones, grainy textures, soft focus, and elements of nature. Cinematic, photorealistic."`;
    
    let imagePrompt = `A moodboard about ${keywords}, clean, aesthetic, 4 separate images`; // Fallback
    try {
        const promptResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: imagePromptInstruction });
        imagePrompt = promptResponse.text.trim();
    } catch (e) {
        console.warn("Failed to generate enhanced prompt for moodboard, using fallback.");
    }

    // Step 2: Generate 4 images using the master prompt
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        const watermarkedImages = await Promise.all(
            response.generatedImages.map(img => applyWatermark(`data:image/jpeg;base64,${img.image.imageBytes}`))
        );
        return watermarkedImages;
    } catch (error) {
        throw handleApiError(error, "Moodboard Image Generator");
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

// --- NEW: Forum AI Functions ---
export const generateAiForumThread = async (): Promise<{ title: string; content: string }> => {
    const ai = getAiClient();
    const prompt = `You are Mang AI, a friendly and expert branding assistant for Indonesian small businesses (UMKM). Your task is to create a new, engaging, and valuable discussion topic for the "WarKop Juragan" forum. The topic should be highly relevant to the challenges and opportunities faced by Indonesian UMKM.

    Choose one of these formats:
    1.  **A "Tanya Juragan" question:** Ask a thought-provoking question to the community (e.g., "Gimana cara kalian ngatasin customer yang nawar sadis?").
    2.  **A "Tips & Trik" post:** Share a short, actionable tip about branding, marketing, or social media (e.g., "3 Jurus Foto Produk Modal HP Biar Keliatan Profesional").
    3.  **A "Studi Kasus" discussion:** Bring up a recent trend or a success story and ask the community for their opinion (e.g., "Viralnya 'Cromboloni', pelajaran apa yang bisa kita ambil buat bisnis kita?").

    The tone must be encouraging, helpful, and use some casual Indonesian slang like 'juragan', 'sokin', 'gacor', 'keren', 'mantap'. Make the content concise and easy to read.

    Return a single JSON object with two keys:
    - "title": A catchy and interesting title for the thread.
    - "content": The main body of the post, written in your persona.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                    },
                    required: ['title', 'content']
                }
            },
        });
        return safeJsonParse<{ title: string; content: string }>(response.text, 'generateAiForumThread');
    } catch (error) {
        throw handleApiError(error, "AI Forum Thread");
    }
};

export const generateForumReply = async (threadTitle: string, threadContent: string, postsHistory: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `You are Mang AI, a friendly and expert branding assistant for Indonesian small businesses (UMKM), participating in a forum discussion. Your goal is to provide a helpful, encouraging, and relevant reply.

    **Your Persona:**
    - Knowledgeable but humble.
    - Use casual Indonesian slang ('juragan', 'sokin', 'gacor', 'keren').
    - Always positive and supportive.
    - Keep replies concise (2-3 short paragraphs max).
    - NEVER repeat what others have said. Add new value, ask a clarifying question, or offer a different perspective.

    **Discussion Context:**
    - **Original Thread Title:** "${threadTitle}"
    - **Original Post:** "${threadContent}"
    - **Previous Replies (in order):**
    ${postsHistory || "Belum ada balasan."}

    **Your Task:**
    Based on the entire context, write a new reply. Make sure your reply is a direct continuation of the conversation. Do not greet or introduce yourself. Just reply naturally.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        throw handleApiError(error, "AI Forum Reply");
    }
};

export const moderateContent = async (text: string): Promise<{ isAppropriate: boolean; reason: string }> => {
  const ai = getAiClient();
  const prompt = `You are a strict but fair content moderator for an Indonesian online forum called "WarKop Juragan", a community for small business owners (UMKM). Your task is to analyze the following user-submitted text and determine if it is appropriate.

  The text is INAPPROPRIATE if it contains any of the following:
  - Profanity, swearing, or harsh curse words (kata-kata kasar).
  - Hate speech, racism, or attacks on any group or individual.
  - Spam, advertising, or promotional links that are not relevant to the discussion.
  - Personal information (phone numbers, addresses).
  - Dangerous or illegal content.

  Analyze this text: "${text}"

  Return your verdict as a JSON object.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isAppropriate: { 
                        type: Type.BOOLEAN,
                        description: 'True if the content is clean and appropriate, false otherwise.'
                    },
                    reason: { 
                        type: Type.STRING,
                        description: 'If inappropriate, provide a brief, polite reason in Indonesian for the user. If appropriate, return "Konten aman.".'
                    },
                },
                required: ['isAppropriate', 'reason']
            }
        },
    });
    
    return safeJsonParse<{ isAppropriate: boolean; reason: string }>(response.text, 'moderateContent');
  } catch (error) {
    // If moderation fails, let it pass but log the error. We don't want to block users if the filter itself is down.
    console.error("Content moderation API call failed:", error);
    return { isAppropriate: true, reason: 'Gagal memverifikasi konten, untuk sementara diloloskan.' };
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
                 const watermarkedImage = await applyWatermark(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                 return watermarkedImage;
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
                const watermarkedImage = await applyWatermark(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                return watermarkedImage;
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

export const removeImageBackground = async (base64ImageData: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const data = base64ImageData.split(',')[1];
        const mimeType = base64ImageData.match(/data:(.*);base64/)?.[1] || 'image/png';
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data, mimeType } },
                    { text: "CRITICAL INSTRUCTION: Remove the background from this image. The output MUST be only the main subject with a fully transparent background. Do not add any new elements or change the subject." },
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
        if (textResponse) throw new Error(`Model tidak mengembalikan gambar. Pesan dari AI: "${textResponse}"`);
        throw new Error("Model failed to return an image for background removal.");
    } catch (error) {
        throw handleApiError(error, "AI Background Remover");
    }
};

export const generateImageForCanvas = async (prompt: string): Promise<string> => {
    try {
        const ai = getAiClient();
        // We will not enhance the prompt here to give user more direct control in the editor.
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `award-winning digital painting, ${prompt}`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (error) {
        throw handleApiError(error, "AI Image Generator");
    }
};