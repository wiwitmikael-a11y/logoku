// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from "@google/genai";
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../services/soundService';
import type { BrandInputs, VoiceWizardStep } from '../types';
import ProgressStepper from './common/ProgressStepper';
import Button from './common/Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface Props {
  show: boolean;
  onClose: () => void;
  onComplete: (data: BrandInputs) => void;
}

// --- Function Declarations for Gemini ---
const functionDeclarations: FunctionDeclaration[] = [
  { name: 'saveBusinessName', parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] } },
  { name: 'saveBusinessDetails', parameters: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ['category', 'detail'] } },
  { name: 'saveTargetAudience', parameters: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, age: { type: Type.STRING } }, required: ['category', 'age'] } },
  { name: 'saveValueProposition', parameters: { type: Type.OBJECT, properties: { value: { type: Type.STRING } }, required: ['value'] } },
  { name: 'saveCompetitors', parameters: { type: Type.OBJECT, properties: { competitors: { type: Type.STRING } }, required: ['competitors'] } },
  { name: 'confirmAllDetails', parameters: { type: Type.OBJECT, properties: {}, required: [] } },
];

const VoiceBrandingWizard: React.FC<Props> = ({ show, onClose, onComplete }) => {
  const { profile } = useAuth();
  const [status, setStatus] = useState('Initializing...');
  const [wizardStep, setWizardStep] = useState<VoiceWizardStep>('GREETING');
  const [transcript, setTranscript] = useState<{ speaker: 'mang-ai' | 'user', text: string }[]>([]);
  const [brandInputs, setBrandInputs] = useState<Partial<BrandInputs>>({});
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const workflowSteps: VoiceWizardStep[] = ['GET_BUSINESS_NAME', 'GET_BUSINESS_DETAILS', 'GET_TARGET_AUDIENCE', 'GET_VALUE_PROPOSITION', 'GET_COMPETITORS', 'CONFIRMATION'];
  const currentStepIndex = workflowSteps.indexOf(wizardStep);

  const addTranscript = (speaker: 'mang-ai' | 'user', text: string) => {
    if (!text.trim()) return;
    setTranscript(prev => [...prev, { speaker, text }]);
  };

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);

  const connectToGemini = useCallback(async () => {
    if (sessionPromiseRef.current) return;
    setStatus('Meminta izin mikrofon...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_API_KEY});
      
      setStatus('Menyambungkan ke Mang AI...');

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          tools: [{ functionDeclarations }],
          systemInstruction: `You are "Mang AI", a friendly and professional branding consultant for Indonesian small businesses (UMKM). Guide the user through a series of questions to gather information for their brand persona. Ask one question at a time. After getting an answer, confirm it by calling the appropriate function, then wait for the tool response before asking the next question. Your tone is helpful, encouraging, and uses some casual Indonesian slang like 'juragan', 'sokin', 'gacor'. Start by greeting the user and asking for their business name.`,
        },
        callbacks: {
          onopen: () => {
            setStatus('Terhubung! Silakan bicara...');
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (audioProcessingEvent) => {
              if (!isListening) return;
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = { data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32767)).buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              addTranscript('user', message.serverContent.inputTranscription.text);
            }
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
              const outputCtx = outputAudioContextRef.current;
              if (audioData && outputCtx) {
                const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                
                const currentTime = outputCtx.currentTime;
                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
            }
            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                let result = 'OK';
                let nextStep: VoiceWizardStep | null = null;
                
                switch (fc.name) {
                  case 'saveBusinessName':
                    setBrandInputs(prev => ({ ...prev, businessName: fc.args.name }));
                    nextStep = 'GET_BUSINESS_DETAILS';
                    break;
                  case 'saveBusinessDetails':
                    setBrandInputs(prev => ({ ...prev, businessCategory: fc.args.category, businessDetail: fc.args.detail }));
                    nextStep = 'GET_TARGET_AUDIENCE';
                    break;
                  case 'saveTargetAudience':
                     setBrandInputs(prev => ({ ...prev, targetAudience: `${fc.args.category} usia ${fc.args.age}` }));
                     nextStep = 'GET_VALUE_PROPOSITION';
                    break;
                  case 'saveValueProposition':
                     setBrandInputs(prev => ({ ...prev, valueProposition: fc.args.value }));
                     nextStep = 'GET_COMPETITORS';
                    break;
                  case 'saveCompetitors':
                     setBrandInputs(prev => ({ ...prev, competitors: fc.args.competitors }));
                     nextStep = 'CONFIRMATION';
                    break;
                   case 'confirmAllDetails':
                     setWizardStep('COMPLETED');
                     onComplete(brandInputs as BrandInputs);
                     break;
                }
                if (nextStep) setWizardStep(nextStep);

                sessionPromiseRef.current?.then(session => {
                  session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result } } });
                });
              }
            }
          },
          onerror: (e) => { setError(`Koneksi error: ${e.type}`); setStatus('Error'); },
          onclose: () => setStatus('Koneksi ditutup.'),
        },
      });
    } catch (err) {
      setError(`Gagal mengakses mikrofon. Pastikan kamu sudah memberikan izin di browsermu.`);
      setStatus('Gagal');
    }
  }, [isListening, onComplete, brandInputs]);

  useEffect(() => {
    if (show) {
      connectToGemini();
    }
    return () => {
      sessionPromiseRef.current?.then(session => session.close());
      streamRef.current?.getTracks().forEach(track => track.stop());
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      sessionPromiseRef.current = null;
    };
  }, [show, connectToGemini]);

  const handleToggleListen = () => {
    playSound('click');
    setIsListening(prev => !prev);
    if (!isListening) {
      setStatus('Mendengarkan...');
    } else {
      setStatus('Mang AI sedang berpikir...');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-4 text-white animate-content-fade-in">
      <div className="absolute top-4 right-4">
        <Button onClick={onClose} variant="secondary">Keluar</Button>
      </div>
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center h-full">
        <div className="my-8 w-full">
          <ProgressStepper currentStep={currentStepIndex} />
        </div>
        <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-40 h-40 animate-breathing-ai" style={{ imageRendering: 'pixelated' }} />
        <p className="mt-4 text-lg font-semibold text-splash animate-pulse">{status}</p>

        <div className="w-full h-48 my-6 overflow-y-auto p-4 bg-black/20 rounded-lg text-sm space-y-2">
            {transcript.map((t, i) => (
                <p key={i}><strong className={t.speaker === 'mang-ai' ? 'text-primary' : 'text-accent'}>{t.speaker === 'mang-ai' ? 'Mang AI' : profile?.full_name || 'Anda'}:</strong> {t.text}</p>
            ))}
            <div ref={transcriptEndRef} />
        </div>

        <button onClick={handleToggleListen} className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-500' : 'bg-primary'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          {isListening && <div className="absolute inset-0 border-4 border-red-400 rounded-full animate-ping"></div>}
        </button>
        <p className="mt-4 text-text-muted">{isListening ? 'Ketuk untuk berhenti' : 'Ketuk untuk bicara'}</p>
        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default VoiceBrandingWizard;