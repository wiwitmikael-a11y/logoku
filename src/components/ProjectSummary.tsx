// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Project } from '../types';

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
                 <div className="mx-auto mb-4 w-24 h-24 flex items-center justify-center bg-background rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="font-bold text-text-header text-lg">Ringkasan Proyek</h3>
                <p className="text-sm text-text-muted mt-2">Pilih atau buat proyek baru di sebelah kiri untuk melihat progres Juragan di sini.</p>
            </div>
        );
    }
    
    const { selectedPersona, selectedSlogan, selectedLogoUrl, socialMediaKit, sotoshop_assets, project_name } = project.project_data;

    const countSotoshopAssets = () => {
        if (!sotoshop_assets) return 0;
        return Object.values(sotoshop_assets)
            .filter(Array.isArray)
            .reduce((acc, assetArray) => acc + assetArray.length, 0);
    };
    const totalSotoshopAssets = countSotoshopAssets();
    const socialKitAssetsCount = (socialMediaKit?.profilePictureUrl ? 1 : 0) + (socialMediaKit?.bannerUrl ? 1 : 0);

    return (
        <div className="p-4 bg-surface rounded-2xl sticky top-8 animate-item-appear">
            <h3 className="text-2xl font-bold text-text-header mb-4" style={{fontFamily: 'var(--font-display)'}}>
                Progres Juragan: <span className="text-accent">{project_name}</span>
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
                <SummaryItem icon="📱" label="Kit Media Sosial" isComplete={socialKitAssetsCount > 0}>
                    {socialKitAssetsCount > 0 ? `${socialKitAssetsCount} Aset Dibuat` : 'Belum dibuat'}
                </SummaryItem>
                 <SummaryItem icon="✨" label="Aset Sotoshop" isComplete={totalSotoshopAssets > 0}>
                    {totalSotoshopAssets > 0 ? `${totalSotoshopAssets} Aset Tersimpan` : 'Belum ada aset'}
                </SummaryItem>
            </div>
        </div>
    );
};

export default ProjectSummary;