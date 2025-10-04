// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateLogoOptions } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useAIPet } from '../contexts/AIPetContext';
import type { BrandPersona } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import LegalDisclaimerModal from './common/LegalDisclaimerModal';

interface Props {
  persona: BrandPersona;
  businessName: string;
  onComplete: (data: { logoBase64: string; prompt: string }) => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 4;

const LogoGenerator: React.FC<Props> = ({ persona, businessName, onComplete, onGoToDashboard }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const { setContextualMessage, notifyPetOfActivity } = useAIPet();
  const credits = profile?.credits ?? 0;

  const [prompt, setPrompt] = useState(`A minimalist and modern logo for "${businessName}", representing ${persona.kata_kunci.join(', ')}.`);
  const [logoOptions, setLogoOptions] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const helpMessageShownRef = useRef(false);

  useEffect(() => {
    let activityInterval: number | undefined;
    if (isLoading) {
      activityInterval = window.setInterval(() => notifyPetOfActivity('designing_logo'), 3000);
    }
    return () => {
      if (activityInterval) {
        clearInterval(activityInterval);
      }
    };
  }, [isLoading, notifyPetOfActivity]);
  
  useEffect(() => {
    if (logoOptions.length > 0 || helpMessageShownRef.current || isLoading) {
        return;
    }

    const timerId = setTimeout(() => {
        setContextualMessage("Lagi mentok, ya? Coba deh pake kata kunci 'geometris', 'abstrak', atau 'simbol alam' di prompt logonya!");
        helpMessageShownRef.current = true;
    }, 20000);

    return () => clearTimeout(timerId);

  }, [logoOptions.length, isLoading, setContextualMessage]);


  const handleGenerateLogos = useCallback(async () => {
    if (credits < GENERATION_COST) {
      setShowOutOfCreditsModal(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    setLogoOptions([]);
    setSelectedLogo(null);
    try {
      const results = await generateLogoOptions(prompt);
      await deductCredits(GENERATION_COST);
      setLogoOptions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat logo.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, credits, deductCredits, setShowOutOfCreditsModal]);

  const handleSelectLogo = (logoBase64: string) => {
    setSelectedLogo(logoBase64);
    setShowDisclaimer(true);
  };

  const handleConfirmSelection = () => {
    if (selectedLogo) {
      onComplete({ logoBase64: selectedLogo, prompt });
    }
    setShowDisclaimer(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Langkah 2: Desain Logo</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Sekarang, mari kita buat visual brand-mu. Mang AI akan membuat 4 opsi logo berdasarkan persona yang sudah dipilih.</p>
      </div>

      <Card title="Konfigurasi Logo">
        <div className="flex flex-col gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full bg-background border border-border-main rounded-md p-2"
            placeholder="Jelaskan logo yang kamu inginkan..."
          />
          <Button onClick={handleGenerateLogos} isLoading={isLoading} disabled={credits < GENERATION_COST}>
            Buat 4 Opsi Logo ({GENERATION_COST} Token)
          </Button>
        </div>
      </Card>
      
      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}
      
      {logoOptions.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-center mb-4">Pilih Logo Favoritmu:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {logoOptions.map((logo, index) => (
              <div key={index} onClick={() => handleSelectLogo(logo)} className="cursor-pointer bg-surface p-2 rounded-lg border-2 border-transparent hover:border-primary transition-colors">
                <img src={logo} alt={`Opsi logo ${index + 1}`} className="w-full h-auto aspect-square object-contain" />
              </div>
            ))}
          </div>
        </div>
      )}

      {showDisclaimer && (
        <LegalDisclaimerModal
          onClose={() => setShowDisclaimer(false)}
          onConfirm={handleConfirmSelection}
        />
      )}
    </div>
  );
};

export default LogoGenerator;