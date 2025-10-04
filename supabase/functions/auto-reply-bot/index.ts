// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.20.0';

// FIX: Declare the Deno global to resolve TypeScript errors in environments
// where Deno types are not automatically recognized.
declare const Deno: any;

const MANG_AI_USER_ID = 'mang-ai-official';

// --- Gemini AI Service Logic (replicated for server-side) ---
const generateForumReply = async (ai: GoogleGenAI, threadTitle: string, threadContent: string, postsHistory: string): Promise<string> => {
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
        console.error("AI Forum Reply Generation Error:", error);
        throw new Error("Failed to generate AI reply.");
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
    const payload = await req.json();
    const newPost = payload.record;

    // --- CRITICAL: PREVENT INFINITE LOOP ---
    // If the new post is from Mang AI itself, stop immediately.
    if (newPost.user_id === MANG_AI_USER_ID) {
      console.log('Post is from Mang AI, skipping reply.');
      return new Response(JSON.stringify({ message: 'Post from AI, skipped.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('VITE_SUPABASE_URL')!,
      Deno.env.get('VITE_SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY')!}` } } }
    );

    const ai = new GoogleGenAI({ apiKey: Deno.env.get('VITE_API_KEY')! });

    // 1. Fetch thread and post history for context
    const { data: threadData, error: threadError } = await supabaseClient
      .from('threads')
      .select('title, content')
      .eq('id', newPost.thread_id)
      .single();

    if (threadError) throw threadError;

    const { data: postsData, error: postsError } = await supabaseClient
      .from('posts')
      .select('content, profiles(full_name)')
      .eq('thread_id', newPost.thread_id)
      .order('created_at', { ascending: true });

    if (postsError) throw postsError;

    const postsHistory = postsData
      .map((p: any) => `${p.profiles?.full_name || 'Juragan'}: "${p.content}"`)
      .join('\n');

    // Introduce a human-like delay
    const delay = Math.random() * 5000 + 5000; // 5-10 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
      
    // 2. Generate AI reply
    const aiReplyContent = await generateForumReply(ai, threadData.title, threadData.content, postsHistory);

    // 3. Insert the AI's reply into the database
    const { error: insertError } = await supabaseClient
      .from('posts')
      .insert({
        user_id: MANG_AI_USER_ID,
        thread_id: newPost.thread_id,
        content: aiReplyContent,
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: 'AI reply posted successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing auto-reply:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});