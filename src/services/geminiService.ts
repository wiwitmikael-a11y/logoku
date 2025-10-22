// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Added full content for src/services/geminiService.ts to provide AI functionality.
import { GoogleGenAI, Modality, Type, GenerateVideosResponse, Operation, Video } from '@google/genai';
import type { BrandInputs, BrandPersona, ProjectData, ContentCalendar, SocialProfiles } from '../types';
import { fetchImageAsBase64, createWhiteCanvasBase64, isBase64DataUrl } from '../utils/imageUtils';
import { uploadBase64Image, uploadBase64Audio } from './storageService';

const getBase64Data = (dataUrl: string) => dataUrl.split(',')[1];

let geminiClient: GoogleGenAI | null = null;
let vertexClient: GoogleGenAI | null = null;
export let geminiError: string | null = null;

try {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("VITE_API_KEY environment variable not set.");
  geminiClient = new GoogleGenAI({ apiKey });

  const vertexApiKey = import.meta.env.VITE_VERTEX_API_KEY;
  if (vertexApiKey) {
    vertexClient = new GoogleGenAI({ apiKey: vertexApiKey });
  }

} catch (e) {
  geminiError = (e as Error).message;
  console.error("Gemini Initialization Failed:", geminiError);
}

const getClient = () => {
  if (geminiError) throw new Error(geminiError);
  if (!geminiClient) throw new Error("Gemini client not initialized.");
  return geminiClient;
};

const getVertexClient = () => {
    if (!vertexClient) throw new Error("Vertex client not initialized. Is VITE_VERTEX_API_KEY set?");
    return vertexClient;
};

export const getAiClient = (): GoogleGenAI => getClient();

const parseJsonFromMarkdown = <T>(markdownString: string): T => {
    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = markdownString.match(jsonRegex);
    if (!match || !match[1]) {
        try {
            return JSON.parse(markdownString);
        } catch (e) {
            throw new Error("Failed to parse JSON from model response.");
        }
    }
    return JSON.parse(match[1]);
};

// --- Service Functions ---

export const generateBrandPersonas = async (inputs: BrandInputs): Promise<BrandPersona[]> => {
    const ai = getClient();
    const prompt = `Based on this business information, generate 3 distinct brand persona options in JSON format.
    Business Name: ${inputs.businessName}
    Details: ${inputs.businessDetail}
    Industry: ${inputs.industry}
    Target Audience: ${inputs.targetAudience}
    Value Proposition: ${inputs.valueProposition}
    
    For each persona, provide: nama_persona (string), deskripsi (string, 1-2 sentences), gaya_bicara (string, example snippet), and palet_warna (array of 4 objects with nama and hex string).
    Ensure the hex codes are valid. Respond with ONLY a JSON array.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text) as BrandPersona[];
};

export const generateSlogans = async (inputs: BrandInputs): Promise<string[]> => {
    const ai = getClient();
    const prompt = `Create 5 short, catchy slogans for a business named "${inputs.businessName}". Details: ${inputs.businessDetail}. Target Audience: ${inputs.targetAudience}. Return as a JSON array of strings.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
};

export const generateLogoPrompt = async (slogan: string, persona: BrandPersona): Promise<string> => {
    const ai = getClient();
    const prompt = `Create a concise, effective logo prompt for an image generation AI. The logo should be for a brand with the slogan "${slogan}" and the persona "${persona.nama_persona}". Describe the persona: ${persona.deskripsi}. The prompt should focus on visual elements: simple, vector, minimalist, logo design, using the color palette: ${persona.palet_warna.map(c => c.nama).join(', ')}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const generateImageAndUpload = async (prompt: string, userId: string, number = 1): Promise<string[]> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    
    const urls: string[] = [];
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64Str = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            const url = await uploadBase64Image(base64Str, userId);
            urls.push(url);
        }
    }
    if (urls.length === 0) throw new Error("Image generation failed to return an image.");
    return urls;
};

export const generateLogoOptions = async (prompt: string): Promise<string[]> => {
    const ai = getClient();
    // The nano-banana model generates one image, so we call it four times in parallel.
    const promises = Array(4).fill(0).map(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] }
    }));

    const responses = await Promise.all(promises);
    const allImages = responses.flatMap((res: any) => 
        res.candidates[0].content.parts
            .filter((p: any) => p.inlineData)
            .map((p: any) => `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`)
    );

    if (allImages.length < 4) throw new Error("Logo generation failed to produce 4 options.");
    return allImages;
};

export const editLogo = async (imageUrl: string, prompt: string): Promise<string> => {
    const ai = getClient();
    const base64Image = await fetchImageAsBase64(imageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: getBase64Data(base64Image), mimeType: 'image/png' } },
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Image edit failed.");
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
};

export const generateSocialMediaKitAssets = async (projectData: ProjectData): Promise<{ profilePictureUrl: string, bannerUrl: string }> => {
    if (!projectData.selectedLogoUrl || !projectData.selectedPersona) throw new Error("Logo and Persona required.");
    
    // Generate Profile Pic
    const profilePrompt = `Create a circular social media profile picture using this logo. Place the logo centrally on a background that matches this color palette: ${projectData.selectedPersona.palet_warna.map(c => c.nama).join(', ')}.`;
    const profilePicResponse = await editLogo(projectData.selectedLogoUrl, profilePrompt);

    // Generate Banner
    const bannerPrompt = `Create a simple, clean social media banner (1500x500px). Place the logo on the left or right, leaving space. Use a subtle background pattern inspired by the brand persona: ${projectData.selectedPersona.deskripsi}. Use the brand colors.`;
    const bannerResponse = await editLogo(projectData.selectedLogoUrl, bannerPrompt);
    
    return { profilePictureUrl: profilePicResponse, bannerUrl: bannerResponse };
};

export const generateSocialProfiles = async (inputs: BrandInputs, persona: BrandPersona): Promise<SocialProfiles> => {
    const ai = getClient();
    const prompt = `For a business named "${inputs.businessName}" with persona "${persona.nama_persona}", write:
    1. A short, punchy Instagram bio (max 150 chars).
    2. A very short TikTok bio (max 80 chars).
    3. A slightly more detailed marketplace description (e.g., for Tokopedia, Shopee) (1-2 sentences).
    Return as a JSON object with keys "instagramBio", "tiktokBio", "marketplaceDescription".`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: 'application/json' }});
    return JSON.parse(response.text);
};

export const generateContentCalendar = async (inputs: BrandInputs, persona: BrandPersona): Promise<ContentCalendar> => {
    const ai = getClient();
    const prompt = `Create a 7-day content calendar for "${inputs.businessName}". The persona is "${persona.nama_persona}". For each day, provide a "day", "contentType" (e.g., 'Edukasi', 'Promosi', 'Behind the Scenes'), an "idea", a short "caption", and relevant "hashtags". Use Google Search for trending topics related to ${inputs.industry}.
    Return a JSON object with a "plan" (array of 7 day-objects). The JSON object should be inside a markdown code block.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    });
    
    const parsed = parseJsonFromMarkdown<{ plan: any[] }>(response.text);

    return {
        plan: parsed.plan,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web) || []
    };
};

export const generateMascot = (prompt: string): Promise<string[]> => generateImageAndUpload(prompt, 'mascots', 2);
export const generateMoodboardImages = (prompt: string): Promise<string[]> => generateImageAndUpload(prompt, 'moodboards', 4);
export const generatePattern = (prompt: string): Promise<string[]> => generateImageAndUpload(prompt, 'patterns', 1);

export const generateMoodboardText = async (keywords: string): Promise<{ description: string; palette: string[] }> => {
    const ai = getClient();
    const prompt = `Based on the keywords "${keywords}", generate a brand moodboard concept. Provide a short "description" (2-3 sentences) and a "palette" of 5 hex color codes. Return as a JSON object.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: 'application/json' }});
    return JSON.parse(response.text);
};

export const applyPatternToMockup = (patternUrl: string, mockupUrl: string): Promise<string> => editLogo(mockupUrl, `Apply this pattern realistically onto the main object in the image.`);
export const editProductImage = (imageUrl: string, prompt: string): Promise<string> => editLogo(imageUrl, prompt);

export const generateSceneFromImages = async (imageUrls: string[], prompt: string): Promise<string> => {
    const ai = getClient();
    const imageParts = await Promise.all(
        imageUrls.map(async url => {
            const base64 = await fetchImageAsBase64(url);
            return { inlineData: { data: getBase64Data(base64), mimeType: 'image/png' } };
        })
    );
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Scene generation failed.");
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
};

export const enhancePromptWithPersonaStyle = (prompt: string, persona: BrandPersona | null): string => {
    if (!persona) return prompt;
    return `${prompt}, in the style of a brand that is ${persona.deskripsi}, using a color palette of ${persona.palet_warna.map(c => c.nama).join(', ')}.`;
};

export const generateSpeech = async (script: string, voice: string): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed.");
    // In a real app with user management, this audio should be uploaded to storage
    return `data:audio/mpeg;base64,${base64Audio}`;
};

// --- Video Functions (using Vertex client) ---

export const generateVideo = async (prompt: string, model: string, resolution: '720p' | '1080p', aspectRatio: '16:9' | '9:16'): Promise<Operation<GenerateVideosResponse>> => {
    const ai = getVertexClient();
    return ai.models.generateVideos({
        model,
        prompt,
        config: { numberOfVideos: 1, resolution, aspectRatio },
    });
};

export const checkVideoOperationStatus = (operation: Operation<GenerateVideosResponse>): Promise<Operation<GenerateVideosResponse>> => {
    const ai = getVertexClient();
    return ai.operations.getVideosOperation({ operation });
};

export const extendVideo = (video: Video, prompt: string): Promise<Operation<GenerateVideosResponse>> => {
    const ai = getVertexClient();
    return ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        video,
        config: {
            numberOfVideos: 1,
            resolution: '720p', // Extension requires 720p
        }
    });
};
