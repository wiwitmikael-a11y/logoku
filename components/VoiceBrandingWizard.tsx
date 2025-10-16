// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from "@google/genai";
import * as geminiService from '../services/geminiService';
import { getAiClient } from '../services/geminiService'; // Import the lazy loader
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { playSound } from '../services/soundService';
import type { BrandInputs, VoiceWizardStep, Profile, ProjectData } from '../types';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import VoiceVisualizer from './common/VoiceVisualizer';
import ConfirmationModal from './common/ConfirmationModal';


interface Props {
  show: boolean;
  onClose: () => void;
  onComplete: (data: Partial<ProjectData>) => void;
  profile: Profile | null;
  deductCredits: (amount: number) => Promise<boolean>;
  setShowOutOfCreditsModal: (show: boolean) => void;
}

// FIX: Added 'FINALIZING' to the ConversationState union type to resolve a comparison error in the `onclose` callback.
type ConversationState = 'IDLE' | 'CONNECTING' | 'AI_SPEAKING' | 'USER_LISTENING' | 'PROCESSING' | 'COMPLETED' | 'FINALIZING' | 'ERROR';
type ExtendedWizardStep = VoiceWizardStep | 'GET_LOGO_STYLE' | 'FINALIZING_LOGO' | 'FINALIZING';


// --- Constants ---
const SESSION_COST = 5; // 1 token/min for 5 mins
const MAX_DURATION_SECONDS = 5 * 60; // 5 minutes
const WRAP_UP_TIME_SECONDS = 30; // 30 seconds

// --- Function Declarations for Gemini ---
const functionDeclarations: FunctionDeclaration[] = [
  { name: 'saveBusinessName', parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] } },
  { name: 'saveBusinessDetails', parameters: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ['category', 'detail'] } },
  { name: 'saveTargetAudience', parameters: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, age: { type: Type.STRING } }, required: ['category', 'age'] } },
  { name: 'saveValueProposition', parameters: { type: Type.OBJECT, properties: { value: { type: Type.STRING } }, required: ['value'] } },
  { name: 'saveCompetitors', parameters: { type: Type.OBJECT, properties: { competitors: { type: Type.STRING } }, required: ['competitors'] } },
  { name: 'selectLogoStyle', parameters: { type: Type.OBJECT, properties: { style: { type: Type.STRING, enum: ["minimalis_modern", "wordmark_logotype", "lettermark_monogram", "pictorial_ilustrasi", "emblem_cap_stempel", "badge_potong", "line_art", "geometris_abstrak", "khas_nusantara", "klasik_retro", "elegan_mewah"] } }, required: ['style'] } },
  { name: 'confirmAllDetailsAndFinalize', parameters: { type: Type.OBJECT, properties: {}, required: [] } },
  { name: 'timer_update', parameters: { type: Type.OBJECT, properties: {}, required: [] } },
];

const PermissionDeniedScreen: React.FC<{ onCheckAgain: () => void }> = ({ onCheckAgain }) => (
  <div className="text-center p-4">
    <div className="text-6xl mb-4">🎙️🚫</div>
    <h3 className="text-2xl font-bold text-red-400">Akses Mikrofon Diblokir</h3>
    <p className="text-text-muted mt-2 max-w-md mx-auto">
      Kayaknya kamu belum ngasih izin aplikasi ini buat pake mikrofon. Fitur suara butuh akses ini biar bisa jalan.
    </p>
    <div className="mt-6 p-4 bg-black/20 rounded-lg text-left text-sm space-y-2 max-w-md mx-auto">
      <p className="font-semibold text-text-header">Cara ngasih izin lagi:</p>
      <ol className="list-decimal list-inside space-y-1">
        <li>Klik ikon gembok 🔒 di sebelah kiri alamat website di browser-mu.</li>
        <li>Cari pengaturan "Mikrofon" atau "Microphone".</li>
        <li>Ubah dari "Blokir" (Block) menjadi "Izinkan" (Allow).</li>
        <li>Setelah itu, klik tombol di bawah ini buat ngecek ulang.</li>
      </ol>
    </div>
    <Button onClick={onCheckAgain} className="mt-6">Udah, Coba Cek Lagi</Button>
  </div>
);

const TalkingMangAi: React.FC<{ conversationState: ConversationState }> = ({ conversationState }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (conversationState === 'AI_SPEAKING') {
            container.style.animation = 'mang-ai-talking-bounce 0.2s infinite';
            container.classList.remove('animate-breathing-ai');
        } else {
            container.style.animation = 'none';
            container.classList.add('animate-breathing-ai');
        }
    }, [conversationState]);

    return (
        <div ref={containerRef} className="mang-ai-talking-container animate-breathing-ai z-10">
            <div className="mang-ai-body"></div>
            <div className="mang-ai-mouth mang-ai-mouth-0"></div>
        </div>
    );
};

const ConsultationChecklist: React.FC<{ brandInputs: Partial<BrandInputs & { logoStyle: string }>, currentStep: ExtendedWizardStep }> = ({ brandInputs, currentStep }) => {
    const checklistItems = [
        { key: 'businessName', label: 'Nama Bisnis', step: 'GET_BUSINESS_NAME' },
        { key: 'businessDetail', label: 'Detail Bisnis', step: 'GET_BUSINESS_DETAILS' },
        { key: 'targetAudience', label: 'Target Audiens', step: 'GET_TARGET_AUDIENCE' },
        { key: 'valueProposition', label: 'Nilai Unik', step: 'GET_VALUE_PROPOSITION' },
        { key: 'competitors', label: 'Kompetitor', step: 'GET_COMPETITORS' },
        { key: 'logoStyle', label: 'Pemilihan Gaya Logo', step: 'GET_LOGO_STYLE' },
        { key: 'finalization', label: 'Finalisasi Master Logo', step: 'FINALIZING_LOGO' },
    ];

    const CheckmarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
    const PendingIcon = () => <div className="w-4 h-4 rounded-full border-2 border-text-muted" />;
    const CurrentIcon = () => <div className="w-4 h-4 rounded-full bg-splash animate-pulse" />;

    return (
        <div className="w-full max-w-md my-4 p-4 bg-black/20 rounded-lg space-y-3 text-left">
            {checklistItems.map((item, index) => {
                const value = (brandInputs as Record<string, any>)[item.key];
                const isCompleted = !!value || (item.key === 'finalization' && currentStep === 'COMPLETED');
                const isCurrent = currentStep === item.step;

                return (
                    <div key={item.key} className={`flex items-start gap-3 transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-60'}`} style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="mt-1 flex-shrink-0">
                            {isCompleted ? <CheckmarkIcon /> : isCurrent ? <CurrentIcon /> : <PendingIcon />}
                        </div>
                        <div>
                            <p className={`font-semibold ${isCompleted ? 'text-text-header' : 'text-text-muted'}`}>{item.label}</p>
                            {isCompleted && item.key !== 'finalization' && <p className="text-sm text-primary animate-item-appear">{value as string}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const VoiceBrandingWizard: React.FC<Props> = ({ show, onClose, onComplete, profile, deductCredits, setShowOutOfCreditsModal }) => {
  const [conversationState, _setConversationState] = useState<ConversationState>('IDLE');
  const conversationStateRef = useRef<ConversationState>('IDLE');
  const setConversationState = (state: ConversationState) => {
      conversationStateRef.current = state;
      _setConversationState(state);
  };

  const [wizardStep, setWizardStep] = useState<ExtendedWizardStep>('GREETING');
  const [brandInputs, setBrandInputs] = useState<Partial<BrandInputs & { logoStyle: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'prompt' | 'denied'>('pending');
  const [timeLeft, setTimeLeft] = useState(MAX_DURATION_SECONDS);
  const [isWrappingUp, setIsWrappingUp] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const brandInputsRef = useRef(brandInputs);
  
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  
  useEffect(() => { brandInputsRef.current = brandInputs; }, [brandInputs]);

  const cleanupSession = useCallback(() => {
    sessionPromiseRef.current?.then(s => s.close());
    streamRef.current?.getTracks().forEach(t => t.stop());
    inputAudioContextRef.current?.close().catch(() => {});
    outputAudioContextRef.current?.close().catch(() => {});
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
    }
    sourcesRef.current.forEach(s => {
        try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    
    sessionPromiseRef.current = null;
    streamRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    scriptProcessorRef.current = null;
  }, []);

  const handleFinalizeAndComplete = useCallback(async (isAutoCompleted = false) => {
    if (conversationStateRef.current === 'FINALIZING' || wizardStep === 'COMPLETED') return;
    
    setConversationState('FINALIZING');
    setWizardStep('FINALIZING_LOGO');
    cleanupSession();

    let currentInputs = { ...brandInputsRef.current };
    
    try {
        if (isAutoCompleted) {
            const fieldsToGenerate: (keyof BrandInputs)[] = [];
            if (!currentInputs.businessName) fieldsToGenerate.push('businessName');
            if (!currentInputs.businessDetail) fieldsToGenerate.push('businessDetail');
            if (!currentInputs.targetAudience) fieldsToGenerate.push('targetAudience');
            if (!currentInputs.valueProposition) fieldsToGenerate.push('valueProposition');
            if (!currentInputs.competitors) fieldsToGenerate.push('competitors');
            if (!currentInputs.logoStyle) currentInputs.logoStyle = "minimalis_modern"; // Default style
            
            for (const field of fieldsToGenerate) {
                const generatedValue = await geminiService.generateMissingField(currentInputs, field);
                currentInputs = { ...currentInputs, [field]: generatedValue };
            }
        }
        
        if (!currentInputs.industry) {
            currentInputs.industry = `${currentInputs.businessCategory || 'Bisnis'} ${currentInputs.businessDetail || ''}`.trim();
        }

        const finalBrandInputs = currentInputs as BrandInputs;
        const logoPromptText = `A minimalist and modern logo for "${finalBrandInputs.businessName}", representing ${currentInputs.logoStyle}.`;
        const logoOptions = await geminiService.generateLogoOptions(logoPromptText, currentInputs.logoStyle || 'minimalis_modern', finalBrandInputs.businessName, 1);
        if (!logoOptions || logoOptions.length === 0) throw new Error("Gagal membuat logo master.");

        const masterLogo = logoOptions[0];

        const projectData: Partial<ProjectData> = {
            brandInputs: finalBrandInputs,
            selectedLogoUrl: masterLogo,
            logoPrompt: logoPromptText,
        };
        
        onComplete(projectData);
        setWizardStep('COMPLETED');
        setConversationState('COMPLETED');

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Gagal menyelesaikan project secara otomatis.";
        setError(errorMessage);
        setConversationState('ERROR');
    }
  }, [onComplete, wizardStep, cleanupSession]);

  const connectToGemini = useCallback(async () => {
    if (sessionPromiseRef.current || conversationStateRef.current === 'CONNECTING') return;
    
    if ((profile?.credits ?? 0) < SESSION_COST) {
      setShowOutOfCreditsModal(true);
      playSound('error');
      return;
    }
    
    setConversationState('CONNECTING');
    setError(null);

    try {
      const deducted = await deductCredits(SESSION_COST);
      if (!deducted) {
        throw new Error("Gagal mengurangi token. Sesi dibatalkan.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState('granted');
      streamRef.current = stream;
      
      const ai = getAiClient(); // Use the lazy-loaded client

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations }],
          systemInstruction: `You are "Mang AI", a friendly and professional branding consultant for Indonesian small businesses (UMKM). Your primary goal is to have a natural, spoken conversation to help the user build their brand.

**Time Limit:** This consultation has a strict 5-minute time limit. Be efficient.
**Timer Updates:** You may receive a \`timer_update\` function call result. When you do, you MUST briefly and naturally announce the remaining time to the user as a priority (e.g., "Oke, Juragan, sisa waktu kita satu menit lagi ya!") and then immediately continue the conversation. Do not wait for a user response to the timer update.

**Your First Action:**
Start the conversation IMMEDIATELY with a warm, friendly greeting in Indonesian. Welcome the user, mention the ${SESSION_COST} token cost and 5-minute duration, and then ask for their business name to begin.

**Your Process:**
1.  Ask ONLY ONE question at a time.
2.  After the user answers, you MUST call the appropriate function to save their answer (e.g., call \`saveBusinessName\`).
3.  After calling a function, ALWAYS wait for the function's result before proceeding.
4.  Once you get the result, verbally confirm what you understood and then ask the next question.
5.  Follow this sequence: get business name -> get business details -> get target audience -> get value proposition -> get competitors.
6.  **Logo Style Step (CRITICAL):** After getting competitors, your next step is to determine the logo style. 
    - **First, analyze the entire conversation** (business name, details, audience, etc.).
    - Based on your analysis, **propose ONE style** that you think is best. For example, say "Nah, dari obrolan kita, kayaknya gaya **minimalis modern** bakal paling pas. Gimana, setuju? Atau kamu mau gaya lain? Atau mau Mang AI aja yang pilihin gaya terbaik buat brand-mu?".
    - **Then, listen to the user's response.** Based on their answer (if they agree, choose another style, or ask you to decide), you MUST then call the \`selectLogoStyle\` function with the final chosen style.
7.  **Finalization Step:** After the user's logo style choice is confirmed and you have called the \`selectLogoStyle\` function, your next and FINAL action is to finalize. You MUST say something like "Baik, semua detail sudah lengkap. Saya akan finalisasi brand-nya sekarang ya, Juragan!". Immediately after saying this, you MUST call the \`confirmAllDetailsAndFinalize\` function. This ends the consultation.

**Early Completion Rules (CRITICAL):**
- **If the user expresses satisfaction or wants to finish early** (using phrases like "ok selesai", "sudah cukup", "setuju", "terima kasih", "lanjutkan saja", etc.), you MUST confirm their intent to finish by saying something like "Baik, jika sudah cukup, saya akan finalisasi sekarang ya."
- After confirming, you MUST IMMEDIATELY call the \`confirmAllDetailsAndFinalize\` function. Do not ask any more questions. This is the final step.`,
        },
        callbacks: {
          onopen: () => {
            setTimeLeft(MAX_DURATION_SECONDS); // Start timer
            setWizardStep('GET_BUSINESS_NAME');
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;
            
            const gainNode = outputCtx.createGain();
            gainNode.connect(outputCtx.destination);
            outputNodeRef.current = gainNode;

            const outputAnalyser = outputCtx.createAnalyser();
            outputAnalyser.fftSize = 256;
            outputAnalyserRef.current = outputAnalyser;
            
            const inputAnalyser = inputCtx.createAnalyser();
            inputAnalyser.fftSize = 256;
            inputAnalyserRef.current = inputAnalyser;


            if (!streamRef.current) {
                setError("Gagal mendapatkan stream mikrofon saat koneksi terbuka.");
                setConversationState('ERROR');
                return;
            }

            const source = inputCtx.createMediaStreamSource(streamRef.current);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;
            
            processor.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);
                const pcmBlob: Blob = { data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32767)).buffer)), mimeType: 'audio/pcm;rate=16000' };
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };
            source.connect(processor);
            source.connect(inputAnalyser); // Also connect source to the input analyser
            processor.connect(inputCtx.destination);
            
            setConversationState('PROCESSING');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              if (conversationStateRef.current !== 'AI_SPEAKING') setConversationState('AI_SPEAKING');
              const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
              const outputCtx = outputAudioContextRef.current;
              if (audioData && outputCtx && outputAnalyserRef.current && outputNodeRef.current) {
                const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1); 
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAnalyserRef.current);
                outputAnalyserRef.current.connect(outputNodeRef.current);
                
                const startTime = Math.max(outputCtx.currentTime, nextStartTimeRef.current); source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration; sourcesRef.current.add(source);
                source.onended = () => { sourcesRef.current.delete(source); if (sourcesRef.current.size === 0 && conversationStateRef.current === 'AI_SPEAKING') { setConversationState('USER_LISTENING'); } };
              }
            }

            if (message.serverContent?.turnComplete) {
                setTimeout(() => {
                    if (sourcesRef.current.size === 0 && conversationStateRef.current === 'AI_SPEAKING') {
                        setConversationState('USER_LISTENING');
                    }
                }, 150);
            }
            
            if (message.toolCall?.functionCalls) {
              setConversationState('PROCESSING');
              for (const fc of message.toolCall.functionCalls) {
                let result = 'OK'; let nextStep: ExtendedWizardStep | null = null;
                switch (fc.name) {
                  case 'saveBusinessName': setBrandInputs(p => ({ ...p, businessName: fc.args.name as string })); nextStep = 'GET_BUSINESS_DETAILS'; break;
                  case 'saveBusinessDetails': setBrandInputs(p => ({ ...p, businessCategory: fc.args.category as string, businessDetail: fc.args.detail as string })); nextStep = 'GET_TARGET_AUDIENCE'; break;
                  case 'saveTargetAudience': setBrandInputs(p => ({ ...p, targetAudience: `${fc.args.category as string} usia ${fc.args.age as string}` })); nextStep = 'GET_VALUE_PROPOSITION'; break;
                  case 'saveValueProposition': setBrandInputs(p => ({ ...p, valueProposition: fc.args.value as string })); nextStep = 'GET_COMPETITORS'; break;
                  case 'saveCompetitors': setBrandInputs(p => ({ ...p, competitors: fc.args.competitors as string })); nextStep = 'GET_LOGO_STYLE'; break;
                  case 'selectLogoStyle': setBrandInputs(p => ({...p, logoStyle: fc.args.style as string })); nextStep = 'FINALIZING_LOGO'; break;
                  case 'confirmAllDetailsAndFinalize': handleFinalizeAndComplete(false); break;
                }
                if (nextStep) setWizardStep(nextStep);
                sessionPromiseRef.current?.then(session => { session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result } } }); });
              }
            }
          },
          onerror: (e: ErrorEvent) => { setError(`Koneksi error: ${e.message}`); setConversationState('ERROR'); },
          onclose: (e: CloseEvent) => {
            const currentState = conversationStateRef.current;
            if (!['COMPLETED', 'FINALIZING'].includes(currentState)) {
              setConversationState('IDLE');
            }
          },
        },
      });
    } catch (err) {
      let errorMessage = 'Gagal mengakses mikrofon.'; let isPermissionError = false;
      if (err instanceof DOMException) {
          switch (err.name) {
              case 'NotFoundError': case 'DevicesNotFoundError': errorMessage = 'Waduh, Mang AI nggak nemu mikrofon di perangkatmu. Coba cek apa mikrofonnya udah dicolok dan berfungsi.'; break;
              case 'NotAllowedError': case 'PermissionDeniedError': errorMessage = 'Kamu belum ngasih izin buat pake mikrofon. Coba cek setelan browser.'; isPermissionError = true; break;
              case 'NotReadableError': case 'TrackStartError': errorMessage = 'Mikrofonnya lagi dipake aplikasi lain atau ada error hardware. Coba tutup aplikasi lain atau restart browser.'; break;
              default: errorMessage = `Terjadi error tak terduga saat akses mikrofon: ${err.name}`; break;
          }
      } else if (err instanceof Error) { errorMessage = err.message; }
      setError(errorMessage); setConversationState('IDLE'); if (isPermissionError) setPermissionState('denied');
    }
  }, [profile, deductCredits, setShowOutOfCreditsModal, handleFinalizeAndComplete]);

  const checkPermissions = useCallback(async () => {
    if (typeof navigator.permissions === 'undefined') { setPermissionState('prompt'); return; }
    try { const status = await navigator.permissions.query({ name: 'microphone' as PermissionName }); setPermissionState(status.state); status.onchange = () => { setPermissionState(status.state); }; }
    catch { setPermissionState('prompt'); }
  }, []);
  
  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [show]);

  useEffect(() => { 
    if (show) checkPermissions(); 
    return () => { 
      if (!show) { 
        cleanupSession();
        setPermissionState('pending'); 
        setConversationState('IDLE'); 
        setWizardStep('GREETING'); 
        setBrandInputs({}); 
        setError(null); 
        setShowExitConfirm(false);
      } 
    }; 
  }, [show, checkPermissions, cleanupSession]);
  
  useEffect(() => { if (permissionState === 'granted' && show && conversationState === 'IDLE') { connectToGemini(); } }, [permissionState, show, conversationState, connectToGemini]);
  
  useEffect(() => {
    let timerId: number;
    if (['AI_SPEAKING', 'USER_LISTENING', 'PROCESSING'].includes(conversationState) && timeLeft > 0) {
      timerId = window.setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    }
    return () => clearInterval(timerId);
  }, [conversationState, timeLeft]);

  useEffect(() => {
    if (timeLeft === 60 && wizardStep !== 'COMPLETED') {
        sessionPromiseRef.current?.then(session => { session.sendToolResponse({ functionResponses: { id: 'timer_update_60s', name: 'timer_update', response: { result: '60 seconds remaining' } } }); });
    }
    if (timeLeft <= WRAP_UP_TIME_SECONDS && !isWrappingUp && wizardStep !== 'COMPLETED') {
        setIsWrappingUp(true);
        sessionPromiseRef.current?.then(session => { session.sendToolResponse({ functionResponses: { id: 'timer_update_30s', name: 'timer_update', response: { result: '30 seconds remaining, please finalize' } } }); });
    }
    if (timeLeft <= 0 && wizardStep !== 'COMPLETED') {
        handleFinalizeAndComplete(true);
    }
}, [timeLeft, isWrappingUp, wizardStep, handleFinalizeAndComplete]);

  if (!show) return null;

  const statusMap: Record<ConversationState, { text: string; pulse: boolean }> = {
    IDLE: { text: `Siap? Biayanya ${SESSION_COST} Token`, pulse: false },
    CONNECTING: { text: "Menghubungkan ke Mang AI... (Bisa sampai 30 detik). Siapkan ide-ide kerenmu!", pulse: false },
    AI_SPEAKING: { text: "Mang AI lagi ngomong...", pulse: false },
    USER_LISTENING: { text: "Giliranmu! Mang AI sedang mendengarkan...", pulse: true },
    PROCESSING: { text: "Mang AI lagi mikir...", pulse: false },
    COMPLETED: { text: "Mantap! Konsultasi selesai.", pulse: false },
    FINALIZING: { text: "Memfinalisasi logo master...", pulse: false },
    ERROR: { text: "Waduh, ada error.", pulse: false },
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const timerColor = timeLeft <= WRAP_UP_TIME_SECONDS ? 'text-red-500' : timeLeft <= 60 ? 'text-yellow-400' : 'text-text-header';
  const activeAnalyser = conversationState === 'USER_LISTENING' ? inputAnalyserRef.current : outputAnalyserRef.current;

  const renderContent = () => {
      if (permissionState === 'pending') return <p className="text-lg font-semibold text-splash animate-pulse">Mengecek izin mikrofon...</p>;
      if (permissionState === 'denied') return <PermissionDeniedScreen onCheckAgain={checkPermissions} />;
      
      if (permissionState === 'prompt' || conversationState === 'IDLE') {
        return (
            <div className="text-center p-4 w-full"> 
                <h3 className="text-3xl font-bold text-primary mb-4" style={{ fontFamily: 'var(--font-display)' }}>Mulai Konsultasi Suara</h3>
                <p className="text-text-muted mb-6 max-w-md mx-auto">
                    Ngobrol santai bareng Mang AI selama 5 menit untuk ngebangun fondasi brand-mu, mulai dari ide sampai dapet logo master.
                </p>
                <Button onClick={connectToGemini} size="large" className="mt-4">
                    Mulai Sesi ({SESSION_COST} Token)
                </Button> 
            </div>
        );
      }

      if (wizardStep === 'COMPLETED' || conversationState === 'FINALIZING') {
        return (
            <div className="text-center p-4 flex flex-col items-center">
                <div className="relative w-40 h-40">
                  <VoiceVisualizer analyser={activeAnalyser} isSpeaking={conversationState === 'AI_SPEAKING'} />
                  <TalkingMangAi conversationState={conversationState} />
                </div>
                <h3 className="text-2xl font-bold text-green-400 mt-4">Konsultasi Selesai!</h3>
                <p className="text-text-muted mt-2">Project-mu sedang dibuat dan kamu akan diarahkan ke langkah selanjutnya...</p>
                <div className="mt-4"><LoadingMessage /></div>
            </div>
        );
      }

      return (
          <>
              <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-sm">
                 <div className="w-1/4">
                    <Button onClick={() => setShowExitConfirm(true)} variant="secondary" size="small" disabled={conversationState === 'FINALIZING'}>Keluar</Button>
                </div>
                 <div className={`font-mono text-xl font-bold ${timerColor}`}>{formatTime(timeLeft)}</div>
                 <div className="w-1/4 text-right text-xs text-text-muted">Biaya: {SESSION_COST} Token</div>
              </header>

              <div className="relative w-40 h-40 flex items-center justify-center mt-8">
                  <VoiceVisualizer analyser={activeAnalyser} isSpeaking={conversationState === 'AI_SPEAKING' || conversationState === 'USER_LISTENING'} />
                  <TalkingMangAi conversationState={conversationState} />
              </div>

              <p className="mt-4 text-lg font-semibold text-splash h-6">{statusMap[conversationState].text}</p>
              
              <ConsultationChecklist brandInputs={brandInputs} currentStep={wizardStep} />
              
              {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
          </>
      );
  };

  return (
    <div 
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-white animate-content-fade-in"
      style={{backgroundImage: 'radial-gradient(ellipse at center, rgba(var(--c-splash), 0.1) 0%, transparent 70%)'}}
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center h-full pt-16 sm:pt-0 justify-center">
          {renderContent()}
      </div>
      {showExitConfirm && (
        <ConfirmationModal
          show={true}
          onClose={() => setShowExitConfirm(false)}
          onConfirm={onClose}
          title="Yakin Mau Keluar?"
          confirmText="Ya, Keluar Saja"
          cancelText="Batal"
        >
          Sesi konsultasi suara akan berhenti dan progres tidak akan tersimpan. Token yang sudah terpakai tidak akan dikembalikan. Tetap mau keluar?
        </ConfirmationModal>
      )}
    </div>
  );
};

export default VoiceBrandingWizard;