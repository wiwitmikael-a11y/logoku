// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Project } from '../types';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const SummaryItem: React.FC<{
  icon: string;
  label: string;
  isComplete: boolean;
  children: React.ReactNode;
}> = ({ icon, label, isComplete, children }) => (
  <div className={`flex items-start gap-4 p-3 rounded-lg transition-all duration-300 ${isComplete ? 'bg-green-500/10' : 'bg-background'}`}>
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-500' : 'bg-border-main'}`}>
      {isComplete ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <span className="text-sm">{icon}</span>
      )}
    </div>
    <div>
      <p className={`font-bold text-sm ${isComplete ? 'text-text-header' : 'text-text-muted'}`}>{label}</p>
      <div className={`text-xs ${isComplete ? 'text-text-body' : 'text-text-muted italic'}`}>
        {children}
      </div>
    </div>
  </div>
);

const ProjectSummary: React.FC<{ project: Project | null }> = ({ project }) => {
    if (!project) {
        return (
            <div className="p-6 bg-surface rounded-2xl sticky top-8 text-center animate-item-appear">
                 <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 h-24 mx-auto mb-4 animate-breathing-ai" style={{imageRendering: 'pixelated'}}/>
                <h3 className="font-bold text-text-header text-lg">Ringkasan Proyek</h3>
                <p className="text-sm text-text-muted mt-2">Pilih atau buat proyek baru di sebelah kiri untuk melihat progres Juragan di sini.</p>
            </div>
        );
    }
    
    const { selectedPersona, selectedSlogan, selectedLogoUrl, sotoshop_assets } = project.project_data;

    const countSotoshopAssets = () => {
        if (!sotoshop_assets) return 0;
        // FIX: Added an Array.isArray check. Object.values() on an object with optional properties
        // can result in an array of mixed types (including undefined). This type guard ensures
        // we only access .length on actual arrays, resolving the 'property length does not exist on unknown' error.
        return Object.values(sotoshop_assets).reduce((acc, assetArray) => {
            if (Array.isArray(assetArray)) {
                return acc + assetArray.length;
            }
            return acc;
        }, 0);
    };
    const totalSotoshopAssets = countSotoshopAssets();

    return (
        <div className="p-4 bg-surface rounded-2xl sticky top-8 animate-item-appear">
            <h3 className="text-2xl font-bold text-text-header mb-4" style={{fontFamily: 'var(--font-display)'}}>
                Progres Juragan: <span className="text-accent">{project.project_name}</span>
            </h3>
            <div className="space-y-3">
                <SummaryItem icon="👤" label="Persona Brand" isComplete={!!selectedPersona}>
                    {selectedPersona ? selectedPersona.nama_persona : 'Belum dipilih'}
                </SummaryItem>
                <SummaryItem icon="💬" label="Slogan Juara" isComplete={!!selectedSlogan}>
                    {selectedSlogan ? `"${selectedSlogan}"` : 'Belum dipilih'}
                </SummaryItem>
                <SummaryItem icon="🎨" label="Logo Keren" isComplete={!!selectedLogoUrl}>
                    {selectedLogoUrl ? (
                        <img src={selectedLogoUrl} alt="Logo Terpilih" className="w-20 h-20 mt-1 rounded-lg bg-background p-1" />
                    ) : (
                        'Belum dibuat'
                    )}
                </SummaryItem>
                 <SummaryItem icon="🗄️" label="Aset di Lemari Brand" isComplete={totalSotoshopAssets > 0}>
                    {totalSotoshopAssets > 0 ? `${totalSotoshopAssets} Aset Tersimpan` : 'Belum ada aset Sotoshop'}
                </SummaryItem>
            </div>
        </div>
    );
};

export default ProjectSummary;