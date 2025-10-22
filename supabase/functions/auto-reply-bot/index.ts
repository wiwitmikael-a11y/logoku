// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// Fix: The Deno type reference was invalid. Declaring Deno as a global constant
// satisfies the type checker, as the Deno global is available in the Supabase Edge Function runtime.
declare const Deno: any;
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "@google/genai";

console.log("Auto Reply Bot function initializing...");

// KESALAHAN UTAMA ADA DI SINI.
// Lingkungan server Supabase (Deno) tidak mengenal 'import.meta.env'.
// CARA YANG BENAR adalah menggunakan Deno.env.get() untuk mengambil 'secrets'
// yang sudah Anda set di dashboard Supabase.
const geminiApiKey = Deno.env.get("VITE_API_KEY");

if (!geminiApiKey) {
  console.error("VITE_API_KEY secret not set in Supabase project settings.");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

serve(async (req) => {
  try {
    const { prompt } = await req.json();

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Contoh penggunaan Gemini API di dalam fungsi
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Balas pesan ini secara singkat dan ramah: "${prompt}"`,
    });

    return new Response(
      JSON.stringify({ reply: response.text }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in auto-reply-bot:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});