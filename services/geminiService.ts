// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { BrandPersona, BrandInputs, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, ProjectData, AIPetState } from '../types';
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

// --- Text Generation Services ---

export const generateBrandPersona = async (businessName: string, industry: string, targetAudience: string, valueProposition: string, competitorAnalysis: string | null): Promise<BrandPersona[]> => {
  const competitorContext = competitorAnalysis ? `Here's an analysis of a competitor: ${competitorAnalysis}. Use this to create a differentiated persona.` : '';

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
    6.  'brand_voice': An object with 'deskripsi', 'kata_yang_digunakan' (array), and 'kata_yang_dihindari' (array).`,
    config: {
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text);
};

export const generateSlogans = async (businessName: string, persona: BrandPersona, competitors: string): Promise<string[]> => {
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 5 creative and catchy slogan options for a business named "${businessName}".
        - The brand persona is: "${persona.nama_persona}".
        - Keywords: ${persona.kata_kunci.join(', ')}.
        - Competitor slogans to avoid being too similar to: "${competitors}".
        The output must be a JSON array of strings.`,
        config: {
            responseMimeType: "application/json",
        }
    });
    return JSON.parse(response.text);
};

export const generateContentCalendar = async (businessName: string, persona: BrandPersona, petState: AIPetState | null): Promise<{ calendar: ContentCalendarEntry[], sources: any[] }> => {
    const petContext = petState && petState.stage === 'active' ? `My AI Pet assistant, ${petState.name}, who is ${petState.tier} and has a ${Object.keys(petState.personality).reduce((a, b) => petState.personality[a as keyof typeof petState.personality] > petState.personality[b as keyof typeof petState.personality] ? a : b)} personality, might have some creative ideas.` : '';
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a 7-day social media content calendar for an Indonesian business named "${businessName}". The brand persona is "${persona.nama_persona}". Use Google Search to find relevant trending topics or holidays in Indonesia for the upcoming week.
        ${petContext}
        For each day, provide: 'hari', 'tipe_konten' (e.g., Edukasi, Promosi, Interaksi), 'ide_konten', 'draf_caption' (in Indonesian, using the brand voice: ${persona.brand_voice.deskripsi}), and 'rekomendasi_hashtag' (array of strings). The output must be a valid JSON array of objects.`,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    // The response may not be valid JSON, so we need to be careful.
    try {
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("No JSON array found in the response.");
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return { calendar: parsed, sources: groundingMetadata?.groundingChunks || [] };
    } catch (e) {
        console.error("Failed to parse content calendar JSON:", e);
        // FIX: The AI was sometimes returning a faulty response. Added a fallback to an empty calendar to prevent a crash.
        return { calendar: [], sources: groundingMetadata?.groundingChunks || [] };
    }
};

export const generateSocialProfiles = async (inputs: BrandInputs, persona: BrandPersona, petState: AIPetState | null): Promise<SocialProfileData> => {
    const petContext = petState && petState.stage === 'active' ? `My AI Pet assistant, ${petState.name}, who is ${petState.tier} and has a ${Object.keys(petState.personality).reduce((a, b) => petState.personality[a as keyof typeof petState.personality] > petState.personality[b as keyof typeof petState.personality] ? a : b)} personality, can help make this more creative.` : '';
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create social media profile descriptions for "${inputs.businessName}". The persona is "${persona.nama_persona}". ${petContext}
        Provide:
        1. 'instagramBio': A concise, engaging Instagram bio with emojis and a call-to-action.
        2. 'tiktokBio': A short, punchy TikTok bio.
        3. 'marketplaceDescription': A detailed and persuasive shop description for platforms like Tokopedia or Shopee.`,
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

export const generateSocialAds = async (inputs: BrandInputs, persona: BrandPersona, slogan: string, petState: AIPetState | null): Promise<SocialAdsData> => {
    const petContext = petState && petState.stage === 'active' ? `My AI Pet assistant, ${petState.name}, who is ${petState.tier}, might have a unique perspective for these ads.` : '';
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create 2 social media ad copy options for "${inputs.businessName}", a business that sells "${inputs.businessDetail}".
        The persona is "${persona.nama_persona}" and the slogan is "${slogan}". ${petContext}
        - One for Instagram, focusing on visuals and engagement.
        - One for TikTok, focusing on trends and a strong hook.
        For each, provide 'platform', 'adCopy', and 'hashtags' (array).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
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

export const generateCaptions = async (businessName: string, persona: BrandPersona, topic: string, tone: string): Promise<{ caption: string; hashtags: string[] }[]> => {
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 3 distinct social media caption options for "${businessName}".
        - Persona: "${persona.nama_persona}" (Voice: ${persona.brand_voice.deskripsi})
        - Topic: "${topic}"
        - Tone: "${tone}"
        For each option, provide a 'caption' (in Indonesian) and a 'hashtags' array.`,
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

export const analyzeCompetitorUrl = async (url: string, businessName: string): Promise<string> => {
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the competitor at this URL: ${url}. Provide a concise summary of their brand identity (style, tone, apparent target audience). Based on this, suggest 2-3 key differentiation strategies for a new business named "${businessName}". Format as a simple text summary.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text;
};


// --- Image Generation Services ---

export const generateLogoOptions = async (prompt: string, style: string, businessName: string, count: number = 4): Promise<string[]> => {
    
    let stylePrompt = `A modern, clean, minimalist abstract mark or wordmark with an Indonesian touch.`;
    switch (style) {
        // --- KEEPING ---
        case 'minimalis_modern':
            stylePrompt = `A modern, elegant, simple, memorable, and professional abstract mark or wordmark. It has a clean, minimalist feel.`;
            break;
        case 'badge_potong':
            stylePrompt = `A bold and impactful logo where the business name is cleverly integrated into a solid shape (like a circle, badge, or rectangle) using negative space. The text appears to 'cut through' the shape. This is a popular 'badge' style for modern Indonesian local brands. The design must be clean, easy to read, and often works well in a single color.`;
            break;
        case 'klasik_retro':
            stylePrompt = `A classic, retro, or vintage style logo, perhaps in an emblem or badge format. It should evoke nostalgia and a sense of heritage and authenticity.`;
            break;
        case 'elegan_mewah':
            stylePrompt = `An elegant, luxurious, and premium logo. Use thin lines, sophisticated serif fonts, and a sense of refined class. Often monochromatic or with metallic accents.`;
            break;
        case 'khas_nusantara':
            stylePrompt = `An artistic logo with a distinct Indonesian 'Nusantara' ethnic touch. Incorporate elements of traditional patterns (like batik or ikat), local culture, or natural Indonesian flora/fauna in a modern way.`;
            break;
        case 'geometris_abstrak':
            stylePrompt = `A logo using clean geometric shapes like circles, squares, triangles, or lines to create an abstract and modern mark. It should feel balanced, professional, and innovative.`;
            break;
        
        // --- RENAMED & UPDATED ---
        case 'wordmark_logotype': // was 'tulisan_tangan'
            stylePrompt = `A 'wordmark' or 'logotype' style logo. The entire logo is the business name "${businessName}" itself, rendered in a unique and memorable custom typography. The font choice and styling are the primary focus. It could be a script, serif, or sans-serif, but it must be distinctive.`;
            break;
        case 'pictorial_ilustrasi': // was 'ilustrasi_ceria'
            stylePrompt = `A 'pictorial mark' logo. It is a simple, easily recognizable icon or graphic symbol that represents the business literally or abstractly. This could be a friendly illustrated mascot, a character, or an icon of a relevant object (e.g., a coffee bean for a cafe). The style should be clean and bold.`;
            break;
        case 'emblem_cap_stempel': // was 'cap_stempel'
            stylePrompt = `An 'emblem' logo. The business name "${businessName}" is placed inside a containing shape like a seal, crest, or badge. This gives it a traditional, authentic, and solid feel. It can have a slightly distressed, rustic, or clean texture.`;
            break;
        
        // --- NEW ---
        case 'lettermark_monogram':
            stylePrompt = `A 'lettermark' or 'monogram' style logo. The logo is created from the initials of the business name "${businessName}". It should be a clever and graphically interesting arrangement of 2-3 letters. The design must be simple, memorable, and modern.`;
            break;
        case 'line_art':
            stylePrompt = `A chic and contemporary logo made using a single, thin, continuous line (line art style) or simple flat design shapes. The result should feel minimalist, elegant, and light.`;
            break;
    }

    const enhancedPrompt = `A professional logo for an Indonesian small business (UMKM) named "${businessName}".
- Main Subject/Concept: "${prompt}".
- Style: ${stylePrompt}
- Technical requirements: Vector graphic style. Clean lines. White background. The main logo element must occupy approximately 80% of the total image area for prominence and detail.
- Text Rule: For styles like 'wordmark_logotype', 'lettermark_monogram', 'badge_potong', or 'emblem_cap_stempel', the business name "${businessName}" (or its initials) MUST be integrated into the logo. For other styles, avoid adding text unless it is part of the core logo concept itself.`;
    
    const response = await getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: enhancedPrompt,
        config: {
            numberOfImages: count,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

// Generic helper for multi-modal generation with one or more images and text.
const generateWithImagesAndText = async (base64Images: string[], prompt: string): Promise<string> => {
    const imageParts = base64Images.map(imgStr => {
        const [header, data] = imgStr.split(',');
        const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
        return { inlineData: { data, mimeType } };
    });

    const textPart = { text: prompt };

    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [...imageParts, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        const textResponse = response.text || "No text response provided.";
        throw new Error(`AI tidak mengembalikan gambar. Respons: ${textResponse}`);
    }
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
};


export const generatePackagingDesign = async (prompt: string, logoBase64: string): Promise<string[]> => {
    const logoDataUrl = await fetchImageAsBase64(logoBase64);
    const result = await generateWithImagesAndText([logoDataUrl], prompt);
    return [result]; // Return as an array to match other functions
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
    if (!projectData.selectedPersona || !projectData.brandInputs) {
      throw new Error("Data persona atau brand inputs tidak lengkap untuk generate social media kit.");
    }

    const profilePicPromise = getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A simple, clean profile picture icon using the main elements or colors from the brand style. The style is ${projectData.selectedPersona.kata_kunci.join(', ')}. Use the color palette: ${projectData.selectedPersona.palet_warna_hex.join(', ')}. White background.`,
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

export const generateSceneFromImages = async (base64Images: string[], prompt: string): Promise<string> => {
   return generateWithImagesAndText(base64Images, prompt);
};

export const generateLogoVariations = async (logoUrl: string, businessName: string): Promise<{ main: string; stacked: string; horizontal: string; monochrome: string }> => {
    const base64 = await fetchImageAsBase64(logoUrl);

    const commonPrompt = `The business name is "${businessName}". Use a clean, modern sans-serif font like Montserrat or Poppins. The output must be a high-resolution PNG with a transparent background.`;

    const stackedPromise = generateWithImagesAndText([base64], `Create a stacked logo variation. Place the business name in one or two lines below the provided logo icon. ${commonPrompt}`);
    const horizontalPromise = generateWithImagesAndText([base64], `Create a horizontal logo variation. Place the business name to the right of the provided logo icon. ${commonPrompt}`);
    const monochromePromise = generateWithImagesAndText([base64], `Convert the provided logo icon to a single solid black color. Do not add any text. Ensure the output is a high-resolution PNG with a transparent background.`);

    const [stacked, horizontal, monochrome] = await Promise.all([stackedPromise, horizontalPromise, monochromePromise]);

    return { main: logoUrl, stacked, horizontal, monochrome };
};

export const editLogo = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    return generateWithImagesAndText([dataUrl], prompt);
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
    // Pass a default style for generic canvas generation
    return generateLogoOptions(prompt, 'minimalis_modern', 'Canvas Image', 1).then(res => res[0]);
};

export const generateBusinessNames = (category: string, keywords: string): Promise<string[]> => {
    // Re-use generateSlogans logic by passing a dummy persona
    return generateSlogans(category, { nama_persona: '', kata_kunci: keywords.split(',').map(k => k.trim()) } as any, '');
};
export const generateQuickSlogans = (businessName: string, keywords: string): Promise<string[]> => {
    // Re-use generateSlogans logic by passing a dummy persona
    return generateSlogans(businessName, { nama_persona: '', kata_kunci: keywords.split(',').map(k => k.trim()) } as any, '');
};

export const generateMoodboardText = async (keywords: string): Promise<{ description: string; palette: string[] }> => {
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the keywords "${keywords}", create a brand moodboard concept. Provide a 'description' (a short paragraph) and a 'palette' (an array of 5 hex color codes).`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, palette: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["description", "palette"] } }
    });
    return JSON.parse(response.text);
};

export const generateMoodboardImages = (keywords: string): Promise<string[]> => {
    return generateLogoOptions(`Photorealistic, aesthetic photo representing the vibe of: ${keywords}. No text, no logos.`, 'minimalis_modern', 'Moodboard Image', 4);
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

export const generateAIPetNarrative = async (name: string, tier: string, dominantTrait: string): Promise<string> => {
    const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a short, mysterious, one-paragraph origin story for a digital creature named "${name}". 
        - Its rarity/tier is "${tier}".
        - Its most dominant personality trait is "${dominantTrait}".
        The narrative should be intriguing and hint at its capabilities. Keep it under 50 words. Write in Indonesian.`,
    });
    return response.text.trim();
};

// --- New AI Creator Services from User Request ---

export const generatePattern = async (prompt: string): Promise<string[]> => {
    const response = await getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A seamless, tileable, repeating pattern. Style: ${prompt}. This is for graphic design, fabric print, or packaging. The edges must connect perfectly to create an infinite pattern. Flat 2D vector style. High resolution.`,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateProductPhoto = async (productImageBase64: string, scenePrompt: string): Promise<string> => {
    const prompt = `Take the provided product image, which has a transparent or plain background. Place this product realistically into the following scene: "${scenePrompt}". This should be a high-quality, commercial product photograph. The product should be the main focus. Maintain the original product's appearance and details perfectly. Add realistic lighting and shadows to make it blend in naturally.`;
    const result = await generateWithImagesAndText([productImageBase64], prompt);
    return result;
};

export const generateMascot = async (prompt: string): Promise<string[]> => {
    const response = await getAiClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A simple, cute, friendly brand mascot character for an Indonesian small business (UMKM). Character description: "${prompt}". The style should be a clean 2D vector illustration with bold outlines. CRITICAL: The character must be on a solid white background. No text, no shadows, no complex backgrounds. Full body view.`,
        config: { numberOfImages: 2, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateMascotPose = async (baseMascotUrl: string, poseDescription: string): Promise<string> => {
    const base64 = await fetchImageAsBase64(baseMascotUrl);
    const prompt = `Using the exact same character, art style, and colors from the provided image, redraw the character in a new pose: "${poseDescription}". The background must be solid white. Maintain all original character details precisely.`
    return generateWithImagesAndText([base64], prompt);
}

export const removeBackground = async (imageUrl: string): Promise<string> => {
    const base64 = await fetchImageAsBase64(imageUrl);
    const prompt = `Analyze the provided image. Isolate the main subject. Remove the background completely, making it transparent. Output the result as a PNG with a transparent background.`
    return generateWithImagesAndText([base64], prompt);
}

export const applyPatternToMockup = async (patternUrl: string, mockupUrl: string): Promise<string> => {
    const [patternBase64, mockupBase64] = await Promise.all([
        fetchImageAsBase64(patternUrl),
        fetchImageAsBase64(mockupUrl),
    ]);
    
    const prompt = "Take the first image (the pattern) and apply it as a texture to the second image (the object, which is a white mockup). The pattern should wrap around the object realistically, respecting its shape, lighting, and shadows. The result should be a photorealistic mockup photo. Do not change the original object's shape or the background."
    
    return generateWithImagesAndText([patternBase64, mockupBase64], prompt);
}
