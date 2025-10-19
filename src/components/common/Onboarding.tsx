// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import Button from './Button';
import { playSound } from '../../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface Props {
  onClose: () => void;
}

const Onboarding: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  const stepsConfig = [
    { selector: '[data-onboarding-step="1"]', text: "Selamat datang, Juragan! Di sini kamu bisa membuat dan memilih proyek branding-mu. Coba buat proyek pertamamu untuk mulai." },
    { selector: '[data-onboarding-step="2"]', text: "Ini area kerjamu. Ikuti alur dari Persona, Logo, sampai Konten untuk membangun brand-mu dari nol sampai jadi." },
    { selector: '[data-onboarding-step="3"]', text: "Setiap tab punya fungsi unik. Jelajahi juga 'Sotoshop' untuk fitur-fitur AI yang lebih canggih dan kreatif. Selamat berkarya!" },
  ];

  useEffect(() => {
    if (step < stepsConfig.length) {
      const element = document.querySelector(stepsConfig[step].selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setElementRect(element.getBoundingClientRect());
      }
    } else {
      onClose();
    }
  }, [step]);

  const handleNext = () => {
    playSound('click');
    setStep(prev => prev + 1);
  };
  
  const handleSkip = () => {
    playSound('click');
    onClose();
  }

  if (step >= stepsConfig.length || !elementRect) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 transition-opacity duration-300">
      <div
        className="absolute transition-all duration-500 ease-in-out border-2 border-primary border-dashed rounded-lg shadow-2xl"
        style={{
          top: elementRect.top - 8,
          left: elementRect.left - 8,
          width: elementRect.width + 16,
          height: elementRect.height + 16,
        }}
      />
      <div
        className="absolute bg-surface rounded-lg p-4 max-w-xs w-full shadow-lg animate-content-fade-in"
        style={{
          top: elementRect.bottom + 16,
          left: elementRect.left,
        }}
      >
        <div className="flex gap-3">
          <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-12 h-12 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
          <p className="text-sm text-text-body">{stepsConfig[step].text}</p>
        </div>
        <div className="flex justify-end items-center gap-3 mt-4">
          <button onClick={handleSkip} className="text-xs text-text-muted hover:text-text-header">Lewati</button>
          <Button onClick={handleNext} size="small">
            {step === stepsConfig.length - 1 ? 'Selesai!' : 'Lanjut'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
