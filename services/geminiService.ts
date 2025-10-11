// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { BrandPersona, BrandInputs, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, ProjectData, AIPetState, AIPetPersonalityVector } from '../types';
import { fetchImageAsBase64 } from '../utils/imageUtils';

// DEFERRED INITIALIZATION of GoogleGenAI client to prevent startup crash
let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      // This error is a safeguard. The main App component should catch the missing key before this is ever called.
      throw new Error("VITE_API_KEY is not defined. Please check your environment variables.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// FIX: Added helper function to generate AI Pet context for prompts.
const getPetContextPrompt = (petState: AIPetState | null): string => {
    if (!petState || petState.stage === 'aipod') return '';
    const getDominantTrait = (p: AIPetPersonalityVector): keyof AIPetPersonalityVector => {
      return (Object.keys(p) as Array<keyof AIPetPersonalityVector>).reduce((a, b) => p[a] > p[b] ? a : b);
    };
    const dominantTrait = getDominantTrait(petState.personality);
    return `\n\n**AI Assistant Context:** You are assisted by an AI pet named ${petState.name}. Its dominant personality is "${dominantTrait}". Slightly tailor your response to align with this personality (e.g., if playful, be more fun; if modern, be more sleek).`;
};


// --- Text Generation Services ---

// FIX: Added optional petState argument to provide more context to the AI.
export const generateBrandPersona = async (businessName: string, industry: string, targetAudience: string, valueProposition: string, competitorAnalysis: string | null, petState: AIPetState | null): Promise<BrandPersona[]> => {
  const competitorContext = competitorAnalysis ? `Here's an analysis of a competitor: ${competitorAnalysis}. Use this to create a differentiated persona.` : '';
  const petContext = getPetContextPrompt(petState);

  const response = await getAiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a professional brand strategist for Indonesian UMKM. Create 3 distinct, actionable brand persona options for a business. The output must be a JSON array.
    
    Business Details:
    - Name: "${businessName}"
    - Industry: "${industry}"
    - Target Audience: "${targetAudience}"
    - Value Proposition: "${valueProposition}"
    ${competitorContext}
    
    For each persona, provide:
    1.  'nama_persona': A catchy name in Indonesian (e.g., "Sang Modernis Minimalis", "Si Petualang Alami").
    2.  'deskripsi_singkat': A short paragraph describing the persona's vibe and style.
    3.  'kata_kunci': An array of 3-5 relevant keywords (e.g., "modern", "bersih", "terpercaya").
    4.  'palet_warna_hex': An array of 5 hex color codes that match the persona.
    5.  'customer_avatars': An array of 2 customer avatars, each with 'nama_avatar', 'deskripsi_demografis', 'pain_points' (array), and 'media_sosial' (array).
    6.  'brand_voice': An object with 'deskripsi', 'kata_yang_digunakan' (array), and 'kata_yang_dihindari' (array).${petContext}`,
    config: {
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text);
};

// FIX: Added optional petState argument.
export const generateSlogans = async (businessName: string, persona: BrandPersona, competitors: string, petState: AIPetState | null): Promise<string[]> => {
    const petContext = getPetContextPrompt(petState);
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 5 creative and catchy slogan options for a business named "${businessName}".
        - The brand persona is: "${persona.nama_persona}".
        - Keywords: ${persona.kata_kunci.join(', ')}.
        - Competitor slogans to avoid being too similar to: "${competitors}".
        The output must be a JSON array of strings.${petContext}`,
        config: {
            responseMimeType: "application/json",
        }
    });
    return JSON.parse(response.text);
};

// FIX: Added optional petState argument.
export const generateContentCalendar = async (businessName: string, persona: BrandPersona, petState: AIPetState | null): Promise<{ calendar: ContentCalendarEntry[], sources: any[] }> => {
    const petContext = getPetContextPrompt(petState);
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a 7-day social media content calendar for an Indonesian business named "${businessName}". The brand persona is "${persona.nama_persona}". Use Google Search to find relevant trending topics or holidays in Indonesia for the upcoming week.
        For each day, provide: 'hari', 'tipe_konten' (e.g., Edukasi, Promosi, Interaksi), 'ide_konten', 'draf_caption' (in Indonesian, using the brand voice: ${persona.brand_voice.deskripsi}), and 'rekomendasi_hashtag' (array of strings).${petContext}`,
        config: {
            tools: [{ googleSearch: {} }],
            // FIX: Removed responseMimeType and responseSchema when using googleSearch tool as per guidelines. The model will infer JSON output.
        }
    });
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    return { calendar: JSON.parse(response.text), sources: groundingMetadata?.groundingChunks || [] };
};

// FIX: Added optional petState argument.
export const generateSocialProfiles = async (inputs: BrandInputs, persona: BrandPersona, petState: AIPetState | null): Promise<SocialProfileData> => {
    const petContext = getPetContextPrompt(petState);
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create social media profile descriptions for "${inputs.businessName}". The persona is "${persona.nama_persona}".
        Provide:
        1. 'instagramBio': A concise, engaging Instagram bio with emojis and a call-to-action.
        2. 'tiktokBio': A short, punchy TikTok bio.
        3. 'marketplaceDescription': A detailed and persuasive shop description for platforms like Tokopedia or Shopee.${petContext}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    instagramBio: { type: Type.STRING },
                    tiktokBio: { type: Type.STRING },
                    marketplaceDescription: { type: Type.STRING }
                },
                required: ["instagramBio", "tiktokBio", "marketplaceDescription"]
            }
        }
    });
    return JSON.parse(response.text);
};

// FIX: Added optional petState argument.
export const generateSocialAds = async (inputs: BrandInputs, persona: BrandPersona, slogan: string, petState: AIPetState | null): Promise<SocialAdsData> => {
    const petContext = getPetContextPrompt(petState);
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create 2 social media ad copy options for "${inputs.businessName}", a business that sells "${inputs.businessDetail}".
        The persona is "${persona.nama_persona}" and the slogan is "${slogan}".
        - One for Instagram, focusing on visuals and engagement.
        - One for TikTok, focusing on trends and a strong hook.
        For each, provide 'platform', 'adCopy', and 'hashtags' (array).${petContext}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING, enum: ["Instagram", "TikTok"] },
                        adCopy: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["platform", "adCopy", "hashtags"]
                }
            }
        }
    });
    return JSON.parse(response.text);
};

// FIX: Added optional petState argument.
export const generateCaptions = async (businessName: string, persona: BrandPersona, topic: string, tone: string, petState: AIPetState | null): Promise<{ caption: string; hashtags: string[] }[]> => {
    const petContext = getPetContextPrompt(petState);
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 3 distinct social media caption options for "${businessName}".
        - Persona: "${persona.nama_persona}" (Voice: ${persona.brand_voice.deskripsi})
        - Topic: "${topic}"
        - Tone: "${tone}"
        For each option, provide a 'caption' (in Indonesian) and a 'hashtags' array.${petContext}`,
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
                    required: ["caption", "hashtags"]
                }
            }
        }
    });
    return JSON.parse(response.text);
};

// FIX: Added optional petState argument.
export const analyzeCompetitorUrl = async (url: string, businessName: string, petState: AIPetState | null): Promise<string> => {
    const petContext = getPetContextPrompt(petState);
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the competitor at this URL: ${url}. Provide a concise summary of their brand identity (style, tone, apparent target audience). Based on this, suggest 2-3 key differentiation strategies for a new business named "${businessName}". Format as a simple text summary.${petContext}`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text;
};

// FIX: Added new function required by AIPetContext.
export const generateAIPetNarrative = async (name: string, tier: string, dominantTrait: string): Promise<string> => {
      const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a short, mysterious, one-sentence origin story for a digital pet named "${name}". Its tier is "${tier}" and its most dominant personality trait is "${dominantTrait}". The story should be intriguing and hint at its capabilities. Keep it under 150 characters.`,
      });
      return response.text.trim();
};


// --- Image Generation Services ---

export const generateLogoOptions = async (prompt: string, count: number = 4): Promise<string[]> => {
    const response = await getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `${prompt}, vector logo, minimalist, clean, on a white background, no text unless specified`,
        config: {
            numberOfImages: count,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generatePackagingDesign = async (prompt: string, logoBase64: string): Promise<string[]> => {
    const logoDataUrl = await fetchImageAsBase64(logoBase64);
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: logoDataUrl.split(',')[1] } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    // Assuming the API returns image parts for this model
    const images: string[] = [];
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
    }
    return images;
};

export const generateMerchandiseMockup = async (prompt: string, logoBase64: string): Promise<string[]> => {
    return generatePackagingDesign(prompt, logoBase64); // Re-use the same logic
};

export const generatePrintMedia = async (prompt: string, logoBase64: string): Promise<string[]> => {
    return generatePackagingDesign(prompt, logoBase64); // Re-use the same logic
};

export const generateSocialMediaPostImage = async (topic: string, keywords: string[]): Promise<string[]> => {
    const response = await getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a vibrant, eye-catching social media post image for an Indonesian audience about "${topic}". The style should be modern, clean, and related to these keywords: ${keywords.join(', ')}. Flat graphic illustration style.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateSocialMediaKitAssets = async (projectData: ProjectData): Promise<SocialMediaKitAssets> => {
    const profilePicPromise = getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A simple, clean profile picture icon using the main elements of this logo. The style is ${projectData.selectedPersona.kata_kunci.join(', ')}. Use the color palette: ${projectData.selectedPersona.palet_warna_hex.join(', ')}. White background.`,
        config: { numberOfImages: 1, aspectRatio: '1:1', outputMimeType: 'image/png' },
    });

    const bannerPromise = getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A minimalist social media banner (e.g., for Facebook, Twitter header) for "${projectData.brandInputs.businessName}". The style is ${projectData.selectedPersona.kata_kunci.join(', ')}. Use the color palette: ${projectData.selectedPersona.palet_warna_hex.join(', ')}. It should be abstract and have empty space for text.`,
        config: { numberOfImages: 1, aspectRatio: '16:9', outputMimeType: 'image/png' },
    });

    const [profilePicRes, bannerRes] = await Promise.all([profilePicPromise, bannerPromise]);

    return {
        profilePictureUrl: `data:image/png;base64,${profilePicRes.generatedImages[0].image.imageBytes}`,
        bannerUrl: `data:image/png;base64,${bannerRes.generatedImages[0].image.imageBytes}`,
    };
};

// --- Image Editing Services ---

export const editLogo = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: prompt },
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
    });

    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        throw new Error("AI did not return an image. It might have refused the request.");
    }
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
};

export const generateSceneFromImages = async (base64Images: string[], prompt: string): Promise<string> => {
    const imageParts = base64Images.map(imgStr => {
        const [header, data] = imgStr.split(',');
        const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/jpeg'; // Default to jpeg
        return { inlineData: { data, mimeType } };
    });

    const textPart = { text: prompt };

    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [...imageParts, textPart],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        const textResponse = response.text || "No text response provided.";
        throw new Error(`AI did not return an image. Response: ${textResponse}`);
    }
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
};

export const generateLogoVariations = async (logoUrl: string, businessName: string): Promise<{ main: string; stacked: string; horizontal: string; monochrome: string }> => {
    const base64 = await fetchImageAsBase64(logoUrl);
    const base64Data = base64.split(',')[1];
    const mimeType = base64.match(/data:(.*);base64/)?.[1] || 'image/png';

    const commonPrompt = `The business name is "${businessName}". Use a clean, modern sans-serif font like Montserrat or Poppins. The output must be a high-resolution PNG with a transparent background.`;

    const stackedPromise = editLogo(base64Data, mimeType, `Create a stacked logo variation. Place the business name in one or two lines below the provided logo icon. ${commonPrompt}`);
    const horizontalPromise = editLogo(base64Data, mimeType, `Create a horizontal logo variation. Place the business name to the right of the provided logo icon. ${commonPrompt}`);
    const monochromePromise = editLogo(base64Data, mimeType, `Convert the provided logo icon to a single solid black color. Do not add any text. Ensure the output is a high-resolution PNG with a transparent background.`);

    const [stacked, horizontal, monochrome] = await Promise.all([stackedPromise, horizontalPromise, monochromePromise]);

    return { main: logoUrl, stacked, horizontal, monochrome };
};

// --- Other Services ---

export const moderateContent = async (text: string): Promise<{ isAppropriate: boolean, reason: string }> => {
  // This is a simplified, client-side moderation check.
  // For production, a dedicated moderation model or service is recommended.
  const badWords = ['kontol', 'memek', 'anjing', 'bangsat', 'babi', 'asu', 'goblok', 'tolol'];
  if (badWords.some(word => text.toLowerCase().includes(word))) {
      return { isAppropriate: false, reason: "Konten mengandung kata-kata yang tidak pantas." };
  }
  return { isAppropriate: true, reason: "" };
};

export const generateImageForCanvas = (prompt: string): Promise<string> => {
    return generateLogoOptions(prompt, 1).then(res => res[0]);
};

// FIX: Added optional petState argument.
export const generateBusinessNames = (category: string, keywords: string, petState: AIPetState | null): Promise<string[]> => {
    return generateSlogans(category, { nama_persona: '', kata_kunci: keywords.split(',').map(k => k.trim()) } as any, '', petState);
};
// FIX: Added optional petState argument.
export const generateQuickSlogans = (businessName: string, keywords: string, petState: AIPetState | null): Promise<string[]> => {
    return generateSlogans(businessName, { nama_persona: '', kata_kunci: keywords.split(',').map(k => k.trim()) } as any, '', petState);
};

// FIX: Added optional petState argument.
export const generateMoodboardText = async (keywords: string, petState: AIPetState | null): Promise<{ description: string; palette: string[] }> => {
    const petContext = getPetContextPrompt(petState);
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the keywords "${keywords}", create a brand moodboard concept. Provide a 'description' (a short paragraph) and a 'palette' (an array of 5 hex color codes).${petContext}`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, palette: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["description", "palette"] } }
    });
    return JSON.parse(response.text);
};

export const generateMoodboardImages = (keywords: string): Promise<string[]> => {
    return generateLogoOptions(`Photorealistic, aesthetic photo representing the vibe of: ${keywords}. No text, no logos.`, 4);
};

export const generateMissingField = async (currentInputs: Partial<BrandInputs>, fieldToGenerate: keyof BrandInputs): Promise<string> => {
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following partial business details, please generate a suitable value for the missing field '${fieldToGenerate}'.
        Current Details: ${JSON.stringify(currentInputs)}
        Return only the string value for the requested field.`,
    });
    return response.text.trim();
};