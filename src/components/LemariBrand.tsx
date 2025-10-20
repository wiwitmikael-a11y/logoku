// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { Project, SotoshopAssets } from '../types';
import ImageModal from './common/ImageModal';
import Button from './common/Button';

interface Props {
  project: Project;
  onUpdateProject: (data: any) => Promise<void>;
}

const LemariBrand: React.FC<Props> = ({ project }) => {
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const assets = project.project_data.sotoshop_assets;

  const AssetSection: React.FC<{ title: string; children: React.ReactNode; count?: number }> = ({ title, children, count }) => {
    if (!count || count === 0) return null;
    return (
      <div className="p-4 bg-background rounded-lg">
        <h3 className="font-bold text-text-header mb-3">{title} ({count})</h3>
        {children}
      </div>
    );
  };
  
  const hasAssets = (assets: SotoshopAssets | undefined): boolean => {
    if (!assets) return false;
    return Object.values(assets).some(val => Array.isArray(val) && val.length > 0);
  };

  return (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Lemari Aset Brand: <span className="text-accent">{project.project_data.project_name}</span></h2>
        
        {!hasAssets(assets) ? (
             <div className="p-6 bg-surface rounded-2xl text-center animate-item-appear min-h-[200px] flex flex-col justify-center items-center">
                <div className="mx-auto mb-4 w-24 h-24 flex items-center justify-center bg-background rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                </div>
                <h3 className="font-bold text-text-header text-lg">Lemari Brand Masih Kosong</h3>
                <p className="text-sm text-text-muted mt-2">Gunakan tool di tab "Sotoshop" untuk membuat dan menyimpan aset visual di sini.</p>
            </div>
        ) : (
            <div className="space-y-4">
                <AssetSection title="Maskot" count={assets?.mascots?.length}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {assets?.mascots?.map((url, i) => (
                            <img key={i} src={url} alt={`Mascot ${i}`} className="w-full aspect-square object-contain rounded-md cursor-pointer hover:scale-105 transition-transform" onClick={() => setModalImageUrl(url)} />
                        ))}
                    </div>
                </AssetSection>
                <AssetSection title="Video" count={assets?.videos?.length}>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {assets?.videos?.map((video) => (
                            <video key={video.id} src={video.videoUrl} controls className="w-full aspect-video object-cover rounded-md" />
                        ))}
                    </div>
                </AssetSection>
                <AssetSection title="Presentasi AI" count={assets?.aiPresenter?.length}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {assets?.aiPresenter?.map((p) => (
                           <div key={p.id} className="bg-surface p-2 rounded-lg text-center">
                               <img src={p.characterUrl} alt="Karakter" className="w-24 h-24 mx-auto mb-2"/>
                               <p className="text-xs italic text-text-body mb-2">"{p.script.substring(0, 30)}..."</p>
                               <audio src={p.audioUrl} controls className="w-full h-8" />
                           </div>
                        ))}
                    </div>
                </AssetSection>
                 <AssetSection title="Pola / Motif" count={assets?.patterns?.length}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
                        {assets?.patterns?.map((p, i) => (
                           <div key={i} title={p.prompt} onClick={() => setModalImageUrl(p.url)} className="w-full aspect-square rounded-md cursor-pointer border-2 border-surface" style={{backgroundImage: `url(${p.url})`, backgroundSize: '50% 50%'}} />
                        ))}
                    </div>
                </AssetSection>
                 <AssetSection title="Hasil Studio Foto" count={assets?.photoStudio?.length}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {assets?.photoStudio?.map((p, i) => (
                            <img key={i} src={p.url} alt={p.prompt} title={p.prompt} className="w-full aspect-square object-contain rounded-md cursor-pointer hover:scale-105 transition-transform" onClick={() => setModalImageUrl(p.url)} />
                        ))}
                    </div>
                </AssetSection>
                {/* Add other asset sections similarly */}
            </div>
        )}

        {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Aset" onClose={() => setModalImageUrl(null)} />}
    </div>
  );
};

export default LemariBrand;