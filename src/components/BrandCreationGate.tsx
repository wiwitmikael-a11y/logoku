// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { ProjectData } from '../types';
import Button from './common/Button';
import VoiceBrandingWizard from './VoiceBrandingWizard';
import BrandingWizardModal from './BrandingWizardModal';

interface Props {
  onProjectCreated: (projectData: ProjectData) => Promise<void>;
}

const BrandCreationGate: React.FC<Props> = ({ onProjectCreated }) => {
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);
  const [showManualWizard, setShowManualWizard] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background text-text-body transition-colors duration-300 overflow-hidden animate-content-fade-in">
      <div className="max-w-3xl w-full relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-text-header mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Langkah Pertama: Ciptakan Brand Juara Anda!
        </h1>
        <p className="text-text-body mb-6 max-w-2xl mx-auto">
          Selamat datang di <strong className="text-primary">desain.fun</strong>! Sebelum menjelajah lebih jauh, mari kita bangun fondasi brand pertamamu. Manfaatkan token gratis harian untuk memulai.
        </p>
        <div className="p-4 bg-accent/10 rounded-lg text-sm text-accent mb-8 max-w-xl mx-auto">
            <p><strong>✨ Info Penting:</strong> Setelah brand pertamamu selesai dibuat, semua fitur canggih di dalam aplikasi akan otomatis terbuka. Yuk, mulai!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Voice Wizard Card */}
          <div onClick={() => setShowVoiceWizard(true)} className="p-6 bg-surface rounded-2xl border border-border-main hover:border-primary hover:-translate-y-1 transition-all cursor-pointer text-left">
            <h2 className="text-3xl mb-2">🎙️</h2>
            <h3 className="text-xl font-bold text-text-header mb-2">Mode Suara</h3>
            <p className="text-sm text-text-muted">Ngobrol santai dengan Mang AI untuk meracik ide brand-mu. Cepat, mudah, dan seru!</p>
          </div>

          {/* Manual Wizard Card */}
          <div onClick={() => setShowManualWizard(true)} className="p-6 bg-surface rounded-2xl border border-border-main hover:border-primary hover:-translate-y-1 transition-all cursor-pointer text-left">
            <h2 className="text-3xl mb-2">✍️</h2>
            <h3 className="text-xl font-bold text-text-header mb-2">Mode Manual</h3>
            <p className="text-sm text-text-muted">Isi formulir terpandu untuk kontrol penuh atas setiap detail brand-mu. Lengkap dan presisi.</p>
          </div>
        </div>
      </div>
      
      <VoiceBrandingWizard 
        show={showVoiceWizard} 
        onClose={() => setShowVoiceWizard(false)} 
        onProjectCreated={onProjectCreated} 
      />
      <BrandingWizardModal 
        show={showManualWizard} 
        onClose={() => setShowManualWizard(false)} 
        onComplete={onProjectCreated}
      />
    </div>
  );
};

export default BrandCreationGate;