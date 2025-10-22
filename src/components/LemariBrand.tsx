// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { Project } from '../types';
import ImageModal from './common/ImageModal';

interface Props {
  project: Project;
}

const LemariBrand: React.FC<Props> = ({ project }) => {
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const assets = project.project_data.sotoshop_assets;

  const renderSection = (title: string, items: any[] | undefined, renderItem: (item: any, index: number) => React.ReactNode) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="p-4 bg-background rounded-lg">
        <h3 className="text-xl font-bold text-primary mb-4">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map(renderItem)}
        </div>
      </div>
    );
  };
  
  const allAssetsEmpty = Object.values(assets || {}).every(val => !val || (Array.isArray(val) && val.length === 0));


  return (
    <div className="space-y-6">
       <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full"><span className="text-3xl">📦</span></div>
        <div>
          <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Lemari Brand</h3>
          <p className="text-sm text-text-body mt-1">Semua aset visual yang kamu buat di "Sotoshop" akan tersimpan di sini. Kamu bisa lihat, unduh, atau gunakan kembali aset-aset ini di tool lain.</p>
        </div>
      </div>
      
      {allAssetsEmpty ? (
        <div className="text-center p-8 bg-background rounded-lg min-h-[400px] flex flex-col justify-center items-center">
             <span className="text-5xl mb-4">💨</span>
             <h2 className="text-2xl font-bold text-text-header mt-4">Lemari Masih Kosong</h2>
             <p className="mt-2 text-text-muted max-w-md">Belum ada aset yang dibuat. Coba gunakan tool-tool di "Sotoshop" untuk mengisi lemari brand-mu!</p>
         </div>
      ) : (
          <div className="space-y-6">
              {renderSection('Logo & Variasi', project.project_data.logoOptions, (url, i) => (
                  <img key={i} src={url} alt={`Logo ${i}`} className="w-full aspect-square object-contain bg-white p-2 rounded-md cursor-pointer hover:scale-105 transition-transform" onClick={() => setModalImageUrl(url)} />
              ))}
              {renderSection('Maskot', assets?.mascots, (url, i) => (
                   <img key={i} src={url} alt={`Mascot ${i}`} className="w-full aspect-square object-contain bg-white p-2 rounded-md cursor-pointer hover:scale-105 transition-transform" onClick={() => setModalImageUrl(url)} />
              ))}
              {renderSection('Video', assets?.videos, (video, i) => (
                   <video key={i} src={video.videoUrl} controls className="w-full aspect-video rounded-md" title={video.prompt} />
              ))}
               {renderSection('Presenter AI', assets?.aiPresenter, (presenter, i) => (
                  <div key={i} className="flex flex-col gap-2 items-center text-center">
                    <img src={presenter.characterUrl} alt={`Presenter ${i}`} className="w-full aspect-square object-contain rounded-md" />
                    <audio src={presenter.audioUrl} controls className="w-full h-8" />
                  </div>
               ))}
              {renderSection('Moodboard', assets?.moodboards, (moodboard, i) => (
                <div key={i} className="md:col-span-2 p-2 bg-surface rounded-lg">
                    <p className="text-xs italic">"{moodboard.description}"</p>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                        {moodboard.images.map((img: string, idx: number) => <img key={idx} src={img} alt={`mood ${idx}`} className="w-full aspect-square object-cover rounded" onClick={() => setModalImageUrl(img)}/>)}
                    </div>
                </div>
              ))}
              {renderSection('Pola / Motif', assets?.patterns, (pattern, i) => (
                   <div key={i} className="w-full aspect-square rounded-md cursor-pointer" style={{backgroundImage: `url(${pattern.url})`}} onClick={() => setModalImageUrl(pattern.url)} title={pattern.prompt} />
              ))}
              {renderSection('Foto Produk (Studio)', assets?.photoStudio, (photo, i) => (
                  <img key={i} src={photo.url} alt={`Photo ${i}`} className="w-full aspect-square object-cover bg-white rounded-md cursor-pointer hover:scale-105 transition-transform" onClick={() => setModalImageUrl(photo.url)} title={photo.prompt} />
              ))}
              {renderSection('Scene Mixer', assets?.sceneMixes, (scene, i) => (
                   <img key={i} src={scene.url} alt={`Scene ${i}`} className="w-full aspect-square object-cover bg-white rounded-md cursor-pointer hover:scale-105 transition-transform" onClick={() => setModalImageUrl(scene.url)} title={scene.prompt} />
              ))}
          </div>
      )}

      {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Aset" onClose={() => setModalImageUrl(null)} />}
    </div>
  );
};

export default LemariBrand;
