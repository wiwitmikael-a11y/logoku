// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateBrandPersona, generateSlogans, analyzeCompetitorUrl } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { loadWorkflowState } from '../services/workflowPersistence';
import type { BrandPersona, BrandInputs, AIPetPersonalityVector } from '../types';
import { useAIPet } from '../contexts/AIPetContext';
import { useUserActions } from '../contexts/UserActionsContext';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';

interface Props {
  onComplete: (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => void;
  onGoToDashboard: () => void;
}

const businessCategories = ["Makanan", "Minuman", "Fashion", "Jasa", "Kecantikan & Perawatan Diri", "Kerajinan Tangan & Dekorasi Rumah", "Agrikultur & Produk Tani", "Lainnya"];
const targetAudienceCategories = ["Masyarakat Umum", "Mahasiswa", "Pekerja Kantoran", "Keluarga", "Remaja", "Anak-anak"];

const BrandPersonaGenerator = ({ onComplete, onGoToDashboard }: Props) => {
  const [formState, setFormState] = useState({
    businessName: '',
    businessCategory: 'Makanan',
    businessDetail: '',
    targetAudienceCat: 'Masyarakat Umum',
    targetAudienceAge: '',
    valueProposition: 'Kualitas premium dengan harga terjangkau dan pelayanan yang ramah.',
    competitors: '',
    competitorUrl: '',
  });

  const [personas, setPersonas] = useState<BrandPersona[]>([]);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [selectedPersonaIndex, setSelectedPersonaIndex] = useState<number | null>(null);
  const [selectedSlogan, setSelectedSlogan] = useState<string | null>(null);
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoadingSlogan, setIsLoadingSlogan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { petState, showContextualMessage, notifyPetOfActivity } = useAIPet();
  const { grantFirstTimeCompletionBonus } = useUserActions();
  const suggestionShownRef = useRef(false);

  const personasRef = useRef<HTMLDivElement>(null);
  const slogansRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onboardingFlag = sessionStorage.getItem('onboardingStep2');
    if (onboardingFlag) {
        setShowOnboarding(true);
        sessionStorage.removeItem('onboardingStep2');
    }

    const persistedState = loadWorkflowState();
    if (persistedState?.brandInputs) {
      const { businessName, businessCategory, businessDetail, targetAudience, valueProposition, competitors } = persistedState.brandInputs;
      const ageMatch = targetAudience.match(/usia ([\d\-]+)/i);
      const age = ageMatch ? ageMatch[1] : '';
      const category = targetAudience.replace(/(\s+usia\s+[\d\-]+)/i, '').trim() || 'Masyarakat Umum';
      
      setFormState(prev => ({
        ...prev,
        businessName: businessName || '',
        businessCategory: businessCategory || 'Makanan',
        businessDetail: businessDetail || '',
        targetAudienceCat: category,
        targetAudienceAge: age,
        valueProposition: valueProposition || 'Kualitas premium dengan harga terjangkau dan pelayanan yang ramah.',
        competitors: competitors || '',
      }));
    }
  }, []);

  useEffect(() => {
    if (personas.length > 0 && personasRef.current) personasRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [personas]);

  useEffect(() => {
    if (slogans.length > 0 && slogansRef.current) slogansRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [slogans]);
  
  useEffect(() => {
    if (selectedSlogan) {
      const timer = setTimeout(() => setShowNextStepNudge(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowNextStepNudge(false);
    }
  }, [selectedSlogan]);

  useEffect(() => {
    if (personas.length > 0 && petState && petState.stage !== 'aipod' && !suggestionShownRef.current) {
        const getDominantTrait = (p: AIPetPersonalityVector): keyof AIPetPersonalityVector => {
            return (Object.keys(p) as Array<keyof AIPetPersonalityVector>).reduce((a, b) => p[a] > p[b] ? a : b);
        };

        const dominantTrait = getDominantTrait(petState.personality);
        
        const matchedPersona = personas.find(p => 
            p.nama_persona.toLowerCase().includes(dominantTrait) ||
            p.kata_kunci.some(k => k.toLowerCase().includes(dominantTrait))
        );

        if (matchedPersona) {
            setTimeout(() => {
                showContextualMessage(`Psst, Juragan! Persona <strong>"${matchedPersona.nama_persona}"</strong> ini kayaknya cocok banget sama kepribadianku, lho! Mungkin bisa jadi inspirasi?`);
                suggestionShownRef.current = true;
            }, 1500); // Delay for a more natural feel
        }
    }
  }, [personas, petState, showContextualMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePersona = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const requiredFields: (keyof typeof formState)[] = ['businessName', 'businessDetail', 'targetAudienceAge', 'valueProposition'];
    if (!formState.competitors.trim() && !formState.competitorUrl.trim()) {
      setError("Waduh, Juragan! Tolong isi salah satu, kompetitor via teks atau via URL ya.");
      playSound('error');
      return;
    }
    const emptyField = requiredFields.find(field => !formState[field].trim());
    if (emptyField) {
        setError("Waduh, Juragan! Ada isian yang masih kosong, nih. Tolong lengkapi dulu semua detailnya ya.");
        playSound('error');
        return;
    }

    setIsLoadingPersona(true);
    setAnalysisResult(null);
    let competitorAnalysis: string | null = null;
    setPersonas([]);
    setSlogans([]);
    setSelectedPersonaIndex(null);
    setSelectedSlogan(null);
    setShowNextStepNudge(false);
    playSound('start');

    const combinedIndustry = `${formState.businessCategory} ${formState.businessDetail}`.trim();
    const combinedAudience = `${formState.targetAudienceCat}${formState.targetAudienceAge ? ` usia ${formState.targetAudienceAge}` : ''}`.trim();

    try {
      if (formState.competitorUrl.trim()) {
        setIsAnalyzing(true);
        competitorAnalysis = await analyzeCompetitorUrl(formState.competitorUrl, formState.businessName, petState);
        setAnalysisResult(competitorAnalysis);
        setIsAnalyzing(false);
      }

      const result = await generateBrandPersona(
        formState.businessName, combinedIndustry, combinedAudience, formState.valueProposition, competitorAnalysis, petState
      );
      setPersonas(result);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoadingPersona(false);
      setIsAnalyzing(false);
    }
  }, [formState, petState]);
  
  const handleSelectPersona = useCallback((index: number) => {
      if (selectedPersonaIndex !== index) {
        setSelectedPersonaIndex(index);
        setSlogans([]);
        setSelectedSlogan(null);
        setShowNextStepNudge(false);

        const selected = personas[index];
        if (selected) {
            selected.kata_kunci.forEach(keyword => {
                const personalityKey = keyword.toLowerCase().trim();
                if (['minimalist', 'rustic', 'playful', 'modern', 'luxury', 'feminine', 'bold', 'creative'].includes(personalityKey)) {
                    notifyPetOfActivity('style_choice', personalityKey);
                }
            });
        }
      }
  }, [selectedPersonaIndex, personas, notifyPetOfActivity]);
  
  const handleGenerateSlogans = useCallback(async () => {
    if (selectedPersonaIndex === null || !personas[selectedPersonaIndex]) return;
    setIsLoadingSlogan(true);
    setError(null);
    setSlogans([]);
    playSound('start');

    try {
        const result = await generateSlogans(formState.businessName, personas[selectedPersonaIndex], formState.competitors, petState);
        setSlogans(result);
        playSound('success');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal generate slogan.');
        playSound('error');
    } finally {
        setIsLoadingSlogan(false);
    }
  }, [selectedPersonaIndex, personas, formState, petState]);

  const handleContinue = async () => {
    if (selectedPersonaIndex === null || !selectedSlogan || !personas[selectedPersonaIndex]) return;
    await grantFirstTimeCompletionBonus('persona'); 
    const combinedIndustry = `${formState.businessCategory} ${formState.businessDetail}`.trim();
    const combinedAudience = `${formState.targetAudienceCat}${formState.targetAudienceAge