// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback } from 'react';
import { generateLogoOptions } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
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

const logoStyles = [
    { id: 'minimalis_modern', name: 'Minimalis Modern', description: 'Simpel, bersih, dan kekinian.', icon: '✨' },
    { id: 'ilustrasi_ceria', name: 'Ilustrasi Ceria', description: 'Ramah, menarik, dengan karakter.', icon: '😊' },
    { id: 'klasik_retro', name: 'Klasik / Retro', description: 'Nostalgia, otentik, dan bergaya.', icon: '📜' },
    { id: 'elegan_mewah', name: 'Elegan & Mewah', description: 'Premium, berkelas, dengan garis tipis.', icon: '💎' },
    { id: 'khas_nusantara', name: 'Khas Nusantara', description: 'Artistik dengan sentuhan budaya lokal.', icon: '🎨' },
    { id: 'cap_stempel', name: 'Cap / Stempel', description: 'Otentik, handmade, cocok untuk F&B.', icon: '🏷️' },
    { id: 'tulisan_tangan', name: 'Tulisan Tangan', description: 'Personal, unik, dan artistik.', icon: '✍️' },
    { id: 'geometris_abstrak', name: 'Geometris / Abstrak', description: 'Modern, inovatif, dan profesional.', icon: '📐' },
];

const LogoGenerator: React.FC<Props> = ({ persona, businessName, onComplete, onGoToDashboard }) => {
  const { profile } = useAuth();
  const { deductCredits, setShowOutOfCreditsModal } = useUserActions();
  const credits = profile?.credits ?? 0;

  const [prompt, setPrompt] = useState(`sebuah ${persona.kata_kunci[0]}`);
  const [selectedStyle, setSelectedStyle] = useState('minimalis_modern');
  const [logoOptions, setLogoOptions] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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
      const results = await generateLogoOptions(prompt, selectedStyle);
      await deductCredits(GENERATION_COST);
      setLogoOptions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat logo.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, selectedStyle, credits, deductCredits, setShowOutOfCreditsModal]);

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
        <div className="flex flex-col gap-6">
          <div>
              <label htmlFor="logo-prompt" className="block mb-1.5 text-sm font-medium text-text-muted">Jelaskan objek atau simbol utama logo</label>
              <textarea
                id="logo-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                className="w-full bg-background border border-border-main rounded-md p-2"
                placeholder="cth: biji kopi dan secangkir senyuman"
              />
          </div>
          <div>
            <h4 className="block mb-3 text-sm font-medium text-text-muted">Pilih Gaya Logo</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {logoStyles.map(style => (
                <div 
                  key={style.id} 
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center justify-start text-center ${selectedStyle === style.id ? 'border-primary ring-2 ring-primary/30 bg-primary/10' : 'border-border-main bg-background/50 hover:border-splash/50'}`}
                >
                  <div className="text-2xl mb-1">{style.icon}</div>
                  <p className="font-semibold text-sm text-text-header">{style.name}</p>
                  <p className="text-xs text-text-muted mt-1 flex-grow">{style.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border-main">
            <Button onClick={handleGenerateLogos} isLoading={isLoading} disabled={credits < GENERATION_COST}>
              Buat 4 Opsi Logo ({GENERATION_COST} Token)
            </Button>
          </div>
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