// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, Type, Modality, GenerateContentResponse, VideosOperation, Part, Content } from "@google/genai";
import type {
    BrandInputs,
    BrandPersona,
    ContentCalendarEntry,
    ProjectData,
    SocialMediaKit,
    SocialProfiles
} from '../types';
import { createWhiteCanvasBase64, fetchImageAsBase64, isBase64DataUrl } from '../utils/imageUtils';

let ai: GoogleGenAI;
let apiKeyError: string | null = null;
let vertexApiKey: string | null = null;

try {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
        throw new Error("VITE_API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey });
    vertexApiKey = import.meta.env.VITE_VERTEX_API_KEY || null; // For Vertex-only features if needed
} catch (e) {
    apiKeyError = (e as Error).message;
    console.error("Gemini Initialization Failed:", apiKeyError);
}

export const getApiKeyError = (): string | null => apiKeyError;

export const getAiClient = (): GoogleGenAI => {
    if (apiKeyError) throw new Error(apiKeyError);
    return ai;
};

// --- UTILITY FUNCTIONS ---

/**
 * Parses a JSON object from a model's text response.
 * Handles responses wrapped in markdown code blocks (```json ... ```).
 */
const parseJsonFromResponse = <T>(text: string, fallback: T): T => {
    try {
        const startIndex = text.indexOf('```json');
        const endIndex = text.lastIndexOf('```');
        if (startIndex !== -1 && endIndex > startIndex) {
            const jsonStr = text.substring(startIndex + 7, endIndex).trim();
            return JSON.parse(jsonStr) as T;
        }
        return JSON.parse(text) as T;
    } catch (e) {
        console.warn("Failed to parse JSON, returning fallback. Raw text:", text);
        return fallback;
    }
};

/**
 * Extracts a base64 string from a generateContent response part.
 */
const getBase64FromResponse = (response: GenerateContentResponse): string => {
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        return part.inlineData.data;
    }
    throw new Error("Tidak ada data gambar yang ditemukan dalam respons AI.");
};


// --- CORE BRANDING WORKFLOW ---

export const generateBrandPersonas = async (inputs: BrandInputs): Promise<BrandPersona[]> => {
    const prompt = `
        Based on the following business details, generate 3 distinct and creative brand personas.
        - Business Name: ${inputs.businessName}
        - Industry: ${inputs.industry}
        - Details: ${inputs.businessDetail}
        - Target Audience: ${inputs.targetAudience}
        - Value Proposition: ${inputs.valueProposition}

        For each persona, provide:
        - nama_persona: A catchy name for the persona (e.g., "The Modern Minimalist", "The Playful Creator").
        - deskripsi: A short, engaging description of the brand's personality.
        - gaya_bicara: An example of the brand's tone of voice.
        - palet_warna: An array of 5 color objects, each with a 'hex' code and a 'nama'.
        - visual_style: A description of the visual style (e.g., "Clean, minimalist, with geometric patterns").

        Return the result as a JSON array of 3 persona objects.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return parseJsonFromResponse(response.text, []);
};

export const generateSlogans = async (inputs: BrandInputs): Promise<string[]> => {
    const prompt = `Create 5 short, catchy, and memorable slogans for a business named "${inputs.businessName}" which is a "${inputs.businessDetail}". Return a simple JSON array of strings.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return parseJsonFromResponse(response.text, []);
};

export const generateLogoPrompt = async (slogan: string, persona: BrandPersona): Promise<string> => {
    const prompt = `Create a detailed image generation prompt for a logo.
    The logo should be for a brand with the slogan "${slogan}".
    The brand's personality is "${persona.nama_persona}: ${persona.deskripsi}".
    The visual style is "${persona.visual_style}".
    The color palette is ${persona.palet_warna.map(c => c.nama).join(', ')}.
    The prompt should be in English, descriptive, and suitable for a text-to-image AI. Describe the subject, style, colors, and composition. Make it a vector logo style. Example: "a minimalist vector logo of a smiling coffee bean wearing a crown, clean lines, warm brown and gold colors, professional, on a white background".
    Return only the prompt text itself, without any extra explanation.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text.trim();
};

const generateImageFromPrompt = async (prompt: string, count: number = 1): Promise<string[]> => {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        results.push(`data:image/png;base64,${getBase64FromResponse(response)}`);
    }
    return results;
};

export const generateLogoOptions = async (prompt: string, style: string = 'Vector'): Promise<string[]> => {
    const fullPrompt = `${prompt}, ${style} logo, minimalist, on a white background`;
    return generateImageFromPrompt(fullPrompt, 4);
};

export const editLogo = async (imageUrl: string, editPrompt: string): Promise<string> => {
    const base64Image = isBase64DataUrl(imageUrl) ? imageUrl : await fetchImageAsBase64(imageUrl);
    const mimeType = base64Image.substring(base64Image.indexOf(":") + 1, base64Image.indexOf(";"));
    const data = base64Image.split(',')[1];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data, mimeType } },
                { text: `Edit the logo with this instruction: ${editPrompt}. Keep the overall subject, just modify it.` }
            ]
        },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return `data:image/png;base64,${getBase64FromResponse(response)}`;
};

export const generateSocialMediaKitAssets = async (projectData: ProjectData): Promise<SocialMediaKit> => {
    const { selectedLogoUrl, selectedPersona } = projectData;
    if (!selectedLogoUrl || !selectedPersona) throw new Error("Logo and Persona must be selected.");

    const base64Logo = isBase64DataUrl(selectedLogoUrl) ? selectedLogoUrl : await fetchImageAsBase64(selectedLogoUrl);
    const mimeType = base64Logo.substring(base64Logo.indexOf(":") + 1, base64Logo.indexOf(";"));
    const data = base64Logo.split(',')[1];
    const imagePart = { inlineData: { data, mimeType } };

    const [pfpResponse, bannerResponse] = await Promise.all([
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, { text: `Turn this logo into a cool, circular social media profile picture. Use the brand's visual style: ${selectedPersona.visual_style}.` }] },
            config: { responseModalities: [Modality.IMAGE] },
        }),
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, { text: `Create a social media banner (wide aspect ratio) using this logo. Incorporate the brand's visual style (${selectedPersona.visual_style}) and color palette.` }] },
            config: { responseModalities: [Modality.IMAGE] },
        })
    ]);

    return {
        profilePictureUrl: `data:image/png;base64,${getBase64FromResponse(pfpResponse)}`,
        bannerUrl: `data:image/png;base64,${getBase64FromResponse(bannerResponse)}`,
    };
};

export const generateSocialProfiles = async (inputs: BrandInputs, persona: BrandPersona): Promise<SocialProfiles> => {
    const prompt = `
        Based on this brand:
        - Name: ${inputs.businessName}
        - Details: ${inputs.businessDetail}
        - Persona: ${persona.nama_persona}
        - Tone of voice: ${persona.gaya_bicara}

        Generate the following social media texts:
        1.  instagramBio: A short, engaging bio for Instagram, including a call to action.
        2.  tiktokBio: A very short, punchy bio for TikTok.
        3.  marketplaceDescription: A slightly more detailed description for an e-commerce marketplace store.

        Return the result as a single JSON object with the keys "instagramBio", "tiktokBio", and "marketplaceDescription".
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return parseJsonFromResponse(response.text, { instagramBio: '', tiktokBio: '', marketplaceDescription: '' });
};

export const generateContentCalendar = async (inputs: BrandInputs, persona: BrandPersona): Promise<{ plan: ContentCalendarEntry[], sources: { title: string, uri: string }[] }> => {
    const prompt = `Create a 7-day content calendar for a brand named "${inputs.businessName}".
        The brand's persona is "${persona.nama_persona}" and their business is: "${inputs.businessDetail}".
        For each day, provide a 'day', 'contentType' (e.g., "Product Highlight", "Behind the Scenes", "User-Generated Content", "Educational Post"), an 'idea', a short 'caption', and relevant 'hashtags'.
        Return the result as a JSON object with a single key "plan", which is an array of 7 day objects.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json'
        },
    });

    const plan = parseJsonFromResponse(response.text, { plan: [] });
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map(chunk => ({
        title: chunk.web?.title || 'Unknown Source',
        uri: chunk.web?.uri || '#',
    }));

    return { ...plan, sources };
};

// --- SOTOSHOP TOOLS ---

export const generateMascot = async (prompt: string, count: number, persona?: BrandPersona | null): Promise<string[]> => {
    const fullPrompt = `A cute mascot character design of ${prompt}. ${persona?.visual_style || ''}. Clean vector art, isolated on a white background.`;
    return generateImageFromPrompt(fullPrompt, count);
};

export const generateMoodboardText = async (keywords: string): Promise<{ description: string; palette: string[] }> => {
    const prompt = `Based on the keywords "${keywords}", generate a brand moodboard concept. Provide:
    - description: A short paragraph describing the vibe and feeling.
    - palette: A JSON array of 5 hex color codes that match the vibe.
    Return a single JSON object with keys "description" and "palette".`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return parseJsonFromResponse(response.text, { description: '', palette: [] });
};

export const generateMoodboardImages = async (keywords: string, persona?: BrandPersona | null): Promise<string[]> => {
    const prompt = `Aesthetic moodboard image related to: ${keywords}. ${persona?.visual_style || ''}. High quality photography.`;
    return generateImageFromPrompt(prompt, 4);
};

export const generatePattern = async (prompt: string, persona?: BrandPersona | null): Promise<string[]> => {
    const fullPrompt = `Seamless, tileable pattern of ${prompt}. Style: ${persona?.visual_style || 'colorful, vector'}.`;
    return generateImageFromPrompt(fullPrompt, 1);
};

export const applyPatternToMockup = async (patternUrl: string, mockupUrl: string): Promise<string> => {
    const [patternBase64, mockupBase64] = await Promise.all([
        isBase64DataUrl(patternUrl) ? patternUrl : fetchImageAsBase64(patternUrl),
        fetchImageAsBase64(mockupUrl),
    ]);

    const imageParts: Part[] = [
        { inlineData: { data: patternBase64.split(',')[1], mimeType: 'image/png' } },
        { inlineData: { data: mockupBase64.split(',')[1], mimeType: 'image/png' } },
        { text: "Apply the first image as a pattern onto the object in the second image (the mockup). Maintain the object's shape, shadows, and highlights. The result should be photorealistic." }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: imageParts },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return `data:image/png;base64,${getBase64FromResponse(response)}`;
};

export const editProductImage = async (imageUrl: string, prompt: string, persona?: BrandPersona | null): Promise<string> => {
    const base64Image = isBase64DataUrl(imageUrl) ? imageUrl : await fetchImageAsBase64(imageUrl);
    const mimeType = base64Image.substring(base64Image.indexOf(":") + 1, base64Image.indexOf(";"));
    const data = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data, mimeType } },
                { text: prompt }
            ]
        },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return `data:image/png;base64,${getBase64FromResponse(response)}`;
};

export const mixScene = async (image1Url: string, image2Url: string, prompt: string, persona?: BrandPersona | null): Promise<string> => {
     const [image1Base64, image2Base64] = await Promise.all([
        isBase64DataUrl(image1Url) ? image1Url : fetchImageAsBase64(image1Url),
        isBase64DataUrl(image2Url) ? image2Url : fetchImageAsBase64(image2Url),
    ]);
    const imageParts: Part[] = [
        { inlineData: { data: image1Base64.split(',')[1], mimeType: 'image/png' } },
        { inlineData: { data: image2Base64.split(',')[1], mimeType: 'image/png' } },
        { text: `Combine the two images based on this instruction: "${prompt}". The final image style should be: ${persona?.visual_style || 'photorealistic'}.` }
    ];
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: imageParts },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return `data:image/png;base64,${getBase64FromResponse(response)}`;
};

// --- VIDEO & AI PRESENTER ---

export const generateVideo = async (prompt: string, imageBase64?: string | null): Promise<VideosOperation> => {
    const image = imageBase64 ? { imageBytes: imageBase64.split(',')[1], mimeType: 'image/png' } : undefined;

    return await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });
};

export const extendVideo = async (prompt: string, video: any): Promise<VideosOperation> => {
     return await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        video,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: video.aspectRatio,
        }
    });
};

export const pollVideoOperation = async (operation: VideosOperation): Promise<VideosOperation> => {
    return await ai.operations.getVideosOperation({ operation });
};

export const generateCharacterImage = async (prompt: string): Promise<string> => {
    const fullPrompt = `Full body character design of ${prompt}, 3D Pixar style, friendly expression, on a clean white background.`;
    const [url] = await generateImageFromPrompt(fullPrompt, 1);
    return url;
};

export const generateSpeech = async (script: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // A friendly male voice
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};
