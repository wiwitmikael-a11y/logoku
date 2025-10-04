// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { GoogleGenAI, Type } from 'https://esm.sh/@google/genai@1.20.0';

// FIX: Declare the Deno global to resolve TypeScript errors in environments
// where Deno types are not automatically recognized.
declare const Deno: any;

const MANG_AI_USER_ID = 'mang-ai-official';

// --- Gemini AI Service Logic (replicated for server-side) ---
const generateAiForumThread = async (ai: GoogleGenAI): Promise<{ title: string; content: string }> => {
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
        return JSON.parse(response.text);
    } catch (error) {
        console.error("AI Forum Thread Generation Error:", error);
        throw new Error("Failed to generate AI thread topic.");
    }
};


serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('VITE_SUPABASE_URL')!,
            Deno.env.get('VITE_SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: `Bearer ${Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY')!}` } } }
        );

        const ai = new GoogleGenAI({ apiKey: Deno.env.get('VITE_API_KEY')! });

        // 1. Generate new thread content from AI
        const { title, content } = await generateAiForumThread(ai);

        // 2. Insert the new thread into the database
        const { error: insertError } = await supabaseClient
            .from('threads')
            .insert({
                user_id: MANG_AI_USER_ID,
                title,
                content,
            });

        if (insertError) throw insertError;

        return new Response(JSON.stringify({ message: 'New AI thread posted successfully.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Error in auto-thread-starter:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});