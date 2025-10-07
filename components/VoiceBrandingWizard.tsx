// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from "@google/genai";
import * as geminiService from '../services/geminiService';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { BrandInputs, VoiceWizardStep, Profile } from '../types';
import ProgressStepper from './common/ProgressStepper';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import VoiceVisualizer from './common/VoiceVisualizer';

interface Props {
  show: boolean;
  onClose: () => void;
  onComplete: (data: BrandInputs) => void;
  profile: Profile | null;
  deductCredits: (amount: number) => Promise<boolean>;
  setShowOutOfCreditsModal: (show: boolean) => void;
}

type ConversationState = 'IDLE' | 'CONNECTING' | 'AI_SPEAKING' | 'USER_LISTENING' | 'PROCESSING' | 'COMPLETED' | 'FINALIZING' | 'ERROR';

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
  { name: 'confirmAllDetails', parameters: { type: Type.OBJECT, properties: {}, required: [] } },
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


const VoiceBrandingWizard: React.FC<Props> = ({ show, onClose, onComplete, profile, deductCredits, setShowOutOfCreditsModal }) => {
  const [conversationState, setConversationState] = useState<ConversationState>('IDLE');
  const [wizardStep, setWizardStep] = useState<VoiceWizardStep>('GREETING');
  const [transcript, setTranscript] = useState<{ speaker: 'mang-ai' | 'user', text: string }[]>([]);
  const [currentOutputTranscript, setCurrentOutputTranscript] = useState('');
  const [currentInputTranscript, setCurrentInputTranscript] = useState('');
  const [brandInputs, setBrandInputs] = useState<Partial<BrandInputs>>({});
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'prompt' | 'denied'>('pending');
  const [timeLeft, setTimeLeft] = useState(MAX_DURATION_SECONDS);
  const [isWrappingUp, setIsWrappingUp] = useState(false);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const brandInputsRef = useRef(brandInputs);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const conversationStateRef = useRef(conversationState);
  useEffect(() => { conversationStateRef.current = conversationState; }, [conversationState]);
  useEffect(() => { brandInputsRef.current = brandInputs; }, [brandInputs]);

  const workflowSteps: VoiceWizardStep[] = ['GET_BUSINESS_NAME', 'GET_BUSINESS_DETAILS', 'GET_TARGET_AUDIENCE', 'GET_VALUE_PROPOSITION', 'GET_COMPETITORS', 'CONFIRMATION'];
  const currentStepIndex = workflowSteps.indexOf(wizardStep);

  const addFinalTranscript = (speaker: 'mang-ai' | 'user', text: string) => { if (!text.trim()) return; setTranscript(prev => [...prev, { speaker, text }]); };

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript, currentInputTranscript, currentOutputTranscript]);

  const handleAutoCompleteAndSave = useCallback(async () => {
    if (wizardStep === 'COMPLETED' || conversationStateRef.current === 'FINALIZING') return;

    setConversationState('FINALIZING');
    let currentInputs = { ...brandInputsRef.current };

    try {
        const fieldsToGenerate: (keyof BrandInputs)[] = [];
        if (!currentInputs.businessName) fieldsToGenerate.push('businessName');
        if (!currentInputs.businessDetail) fieldsToGenerate.push('businessDetail');
        if (!currentInputs.targetAudience) fieldsToGenerate.push('targetAudience');
        if (!currentInputs.valueProposition) fieldsToGenerate.push('valueProposition');
        if (!currentInputs.competitors) fieldsToGenerate.push('competitors');
        
        if (fieldsToGenerate.length > 0) {
            for (const field of fieldsToGenerate) {
                const generatedValue = await geminiService.generateMissingField(currentInputs, field);
                currentInputs = { ...currentInputs, [field]: generatedValue };
            }
        }
        
        if (!currentInputs.industry) {
            currentInputs.industry = `${currentInputs.businessCategory || 'Bisnis'} ${currentInputs.businessDetail || ''}`.trim();
        }

        onComplete(currentInputs as BrandInputs);
        setWizardStep('COMPLETED');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Gagal menyelesaikan project secara otomatis.";
        setError(errorMessage);
        setConversationState('ERROR');
    }
  }, [onComplete, wizardStep]);

  const connectToGemini = useCallback(async () => {
    if (sessionPromiseRef.current || conversationStateRef.current === 'CONNECTING') return;
    
    if ((profile?.credits ?? 0) < SESSION_COST) {
      setShowOutOfCreditsModal(true);
      playSound('error');
      return;
    }
    
    setConversationState('CONNECTING');
    setError(null);
    setTranscript([]);

    try {
      const deducted = await deductCredits(SESSION_COST);
      if (!deducted) {
        throw new Error("Gagal mengurangi token. Sesi dibatalkan.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState('granted');
      streamRef.current = stream;
      
      const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_API_KEY});

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
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
5.  Follow this sequence: get business name -> get business details -> get target audience -> get value proposition -> get competitors -> then confirm all details by reciting them back to the user and call \`confirmAllDetails\`.
6.  Maintain a helpful, encouraging tone. Use casual Indonesian slang like 'juragan', 'sokin', 'gacor'.`,
        },
        callbacks: {
          onopen: () => {
            setTimeLeft(MAX_DURATION_SECONDS); // Start timer
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;
            
            const gainNode = outputCtx.createGain();
            gainNode.connect(outputCtx.destination);
            outputNodeRef.current = gainNode;

            const analyser = outputCtx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

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
            source.connect(processor); processor.connect(inputCtx.destination);
            
            setConversationState('PROCESSING');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) { setCurrentInputTranscript(message.serverContent.inputTranscription.text); }
            if (message.serverContent?.outputTranscription) { if (conversationStateRef.current !== 'AI_SPEAKING') setConversationState('AI_SPEAKING'); setCurrentOutputTranscript(message.serverContent.outputTranscription.text); }
            
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              if (conversationStateRef.current !== 'AI_SPEAKING') setConversationState('AI_SPEAKING');
              const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
              const outputCtx = outputAudioContextRef.current;
              if (audioData && outputCtx && analyserRef.current && outputNodeRef.current) {
                const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1); 
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyserRef.current);
                analyserRef.current.connect(outputNodeRef.current);
                
                const startTime = Math.max(outputCtx.currentTime, nextStartTimeRef.current); source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration; sourcesRef.current.add(source);
                source.onended = () => { sourcesRef.current.delete(source); if (sourcesRef.current.size === 0 && conversationStateRef.current === 'AI_SPEAKING') { setConversationState('USER_LISTENING'); } };
              }
            }

            if (message.serverContent?.turnComplete) {
                if (currentInputTranscript) { addFinalTranscript('user', currentInputTranscript); setCurrentInputTranscript(''); }
                if (currentOutputTranscript) { addFinalTranscript('mang-ai', currentOutputTranscript); setCurrentOutputTranscript(''); }
                setTimeout(() => {
                    if (sourcesRef.current.size === 0 && conversationStateRef.current === 'AI_SPEAKING') {
                        setConversationState('USER_LISTENING');
                    }
                }, 150);
            }
            
            if (message.toolCall?.functionCalls) {
              setConversationState('PROCESSING');
              for (const fc of message.toolCall.functionCalls) {
                let result = 'OK'; let nextStep: VoiceWizardStep | null = null;
                switch (fc.name) {
                  case 'saveBusinessName': setBrandInputs(p => ({ ...p, businessName: fc.args.name as string })); nextStep = 'GET_BUSINESS_DETAILS'; break;
                  case 'saveBusinessDetails': setBrandInputs(p => ({ ...p, businessCategory: fc.args.category as string, businessDetail: fc.args.detail as string })); nextStep = 'GET_TARGET_AUDIENCE'; break;
                  case 'saveTargetAudience': setBrandInputs(p => ({ ...p, targetAudience: `${fc.args.category as string} usia ${fc.args.age as string}` })); nextStep = 'GET_VALUE_PROPOSITION'; break;
                  case 'saveValueProposition': setBrandInputs(p => ({ ...p, valueProposition: fc.args.value as string })); nextStep = 'GET_COMPETITORS'; break;
                  case 'saveCompetitors': setBrandInputs(p => ({ ...p, competitors: fc.args.competitors as string })); nextStep = 'CONFIRMATION'; break;
                  case 'confirmAllDetails': setWizardStep('COMPLETED'); handleAutoCompleteAndSave(); break;
                }
                if (nextStep) setWizardStep(nextStep);
                sessionPromiseRef.current?.then(session => { session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result } } }); });
              }
            }
          },
          onerror: (e) => { setError(`Koneksi error: ${e.type}`); setConversationState('ERROR'); },
          onclose: () => { if (conversationStateRef.current !== 'COMPLETED' && conversationStateRef.current !== 'FINALIZING') setConversationState('IDLE'); },
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
  }, [profile, deductCredits, setShowOutOfCreditsModal, handleAutoCompleteAndSave]);

  const checkPermissions = useCallback(async () => {
    if (typeof navigator.permissions === 'undefined') { setPermissionState('prompt'); return; }
    try { const status = await navigator.permissions.query({ name: 'microphone' as PermissionName }); setPermissionState(status.state); status.onchange = () => { setPermissionState(status.state); }; }
    catch { setPermissionState('prompt'); }
  }, []);

  const handleMicAction = () => {
    playSound('click');
    if (conversationState === 'IDLE') { connectToGemini(); }
  };

  useEffect(() => { if (show) checkPermissions(); return () => { if (!show) { sessionPromiseRef.current?.then(s => s.close()); streamRef.current?.getTracks().forEach(t => t.stop()); inputAudioContextRef.current?.close().catch(()=>{}); outputAudioContextRef.current?.close().catch(()=>{}); sessionPromiseRef.current = null; streamRef.current = null; inputAudioContextRef.current = null; outputAudioContextRef.current = null; scriptProcessorRef.current = null; setPermissionState('pending'); setTranscript([]); setConversationState('IDLE'); setWizardStep('GREETING'); setBrandInputs({}); setError(null); } }; }, [show, checkPermissions]);
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
    if (timeLeft <= 0 && wizardStep !== 'COMPLETED' && conversationStateRef.current !== 'FINALIZING') {
        sessionPromiseRef.current?.then(s => s.close());
        handleAutoCompleteAndSave();
    }
}, [timeLeft, isWrappingUp, wizardStep, handleAutoCompleteAndSave]);

  if (!show) return null;

  const statusMap: Record<ConversationState, { text: string; pulse: boolean }> = {
    IDLE: { text: `Siap? Biayanya ${SESSION_COST} Token`, pulse: false },
    CONNECTING: { text: "Menyambungkan ke Mang AI...", pulse: false },
    AI_SPEAKING: { text: "Mang AI lagi ngomong...", pulse: false },
    USER_LISTENING: { text: "Giliranmu! Mang AI sedang mendengarkan...", pulse: true },
    PROCESSING: { text: "Mang AI lagi mikir...", pulse: false },
    COMPLETED: { text: "Mantap! Konsultasi selesai.", pulse: false },
    FINALIZING: { text: "Menyiapkan project...", pulse: false },
    ERROR: { text: "Waduh, ada error.", pulse: false },
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const timerColor = timeLeft <= WRAP_UP_TIME_SECONDS ? 'text-red-500' : timeLeft <= 60 ? 'text-yellow-400' : 'text-text-header';

  const renderContent = () => {
      if (permissionState === 'pending') return <p className="text-lg font-semibold text-splash animate-pulse">Mengecek izin mikrofon...</p>;
      if (permissionState === 'denied') return <PermissionDeniedScreen onCheckAgain={checkPermissions} />;
      if (permissionState === 'prompt') return <div className="text-center p-4"> <h3 className="text-2xl font-bold text-primary">Izin Mikrofon Diperlukan</h3> <p className="text-text-muted mt-2">Klik 'Mulai' untuk mengizinkan browser menggunakan mikrofon.</p> <Button onClick={connectToGemini} size="large" className="mt-8">Mulai</Button> </div>;

      if (wizardStep === 'COMPLETED') {
        return (
            <div className="text-center p-4 flex flex-col items-center">
                <div className="relative w-40 h-40">
                  <VoiceVisualizer analyser={analyserRef.current} isSpeaking={conversationState === 'AI_SPEAKING'} />
                  <TalkingMangAi conversationState={conversationState} />
                </div>
                <h3 className="text-2xl font-bold text-green-400 mt-4">Konsultasi Selesai!</h3>
                <p className="text-text-muted mt-2">Project-mu sedang dibuat dan kamu akan diarahkan ke Brand Hub...</p>
                <div className="mt-4"><LoadingMessage /></div>
            </div>
        );
      }

      return (
          <>
              <div className="flex justify-between items-center w-full my-4">
                <div className="w-1/3"></div>
                <div className={`font-mono text-2xl font-bold ${timerColor}`}>{formatTime(timeLeft)}</div>
                <div className="w-1/3 text-right text-xs text-text-muted">Biaya: {SESSION_COST} Token</div>
              </div>
              <div className="w-full"> <ProgressStepper currentStep={currentStepIndex} /> </div>
              <div className="relative w-40 h-40 flex items-center justify-center">
                  <VoiceVisualizer analyser={analyserRef.current} isSpeaking={conversationState === 'AI_SPEAKING'} />
                  <TalkingMangAi conversationState={conversationState} />
              </div>

              <p className="mt-4 text-lg font-semibold text-splash h-6">{statusMap[conversationState].text}</p>
              
              <div className="w-full h-48 my-6 overflow-y-auto p-4 bg-black/20 rounded-lg text-sm space-y-2">
                  {transcript.map((t, i) => (<p key={`final-${i}`}><strong className={t.speaker === 'mang-ai' ? 'text-primary' : 'text-accent'}>{t.speaker === 'mang-ai' ? 'Mang AI' : profile?.full_name || 'Anda'}:</strong> {t.text}</p>))}
                  {currentOutputTranscript && <p><strong className="text-primary">Mang AI:</strong> {currentOutputTranscript}</p>}
                  {currentInputTranscript && <p><strong className="text-accent">{profile?.full_name || 'Anda'}:</strong> {currentInputTranscript}</p>}
                  <div ref={transcriptEndRef} />
              </div>
              
              <button 
                onClick={handleMicAction} 
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                    conversationState === 'USER_LISTENING' ? 'bg-red-500' : 
                    conversationState === 'IDLE' ? 'bg-primary' : 'bg-gray-500 cursor-not-allowed'
                }`}
                disabled={conversationState !== 'IDLE'}
                title={conversationState === 'IDLE' ? `Mulai Konsultasi (${SESSION_COST} Token)` : 'Tunggu giliranmu'}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  {statusMap[conversationState].pulse && <div className="absolute inset-0 border-4 border-red-400 rounded-full animate-ping"></div>}
              </button>
              
              <p className="mt-4 text-text-muted h-5">
                {conversationState === 'IDLE' ? 'Ketuk untuk memulai' : ''}
              </p>
              {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
          </>
      );
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-4 text-white animate-content-fade-in">
      <div className="absolute top-4 right-4"> <Button onClick={onClose} variant="secondary" disabled={conversationState === 'FINALIZING'}>Keluar</Button> </div>
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center h-full pt-16 sm:pt-0 justify-center">
          {renderContent()}
      </div>
    </div>
  );
};

export default VoiceBrandingWizard;