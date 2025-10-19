// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { SotoshopAssets } from '../../types';

interface Props {
  show: boolean;
  onClose: () => void;
  onSelectAsset: (url: string) => void;
  assets: SotoshopAssets | undefined;
}

type AssetCategory = 'mascots' | 'patterns' | 'photoStudio' | 'sceneMixes';

const AssetPickerModal: React.FC<Props> = ({ show, onClose, onSelectAsset, assets }) => {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('mascots');

  if (!show) return null;

  const assetCategories: { key: AssetCategory, name: string, data: any[] | undefined }[] = [
    { key: 'mascots', name: 'Maskot', data: assets?.mascots },
    { key: 'patterns', name: 'Motif', data: assets?.patterns },
    { key: 'photoStudio', name: 'Studio Foto', data: assets?.photoStudio },
    { key: 'sceneMixes', name: 'Scene Mixer', data: assets?.sceneMixes },
  ];
  
  const currentAssets = assetCategories.find(c => c.key === activeCategory)?.data || [];

  const handleSelect = (url: string) => {
    onSelectAsset(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative max-w-2xl w-full h-[70vh] bg-surface rounded-2xl shadow-xl flex flex-col">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 z-10 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6 border-b border-border-main">
          <h2 className="text-2xl font-bold text-text-header" style={{ fontFamily: 'var(--font-display)' }}>Pilih Aset dari Lemari Brand</h2>
          <div className="flex gap-2 mt-3 border-b-2 border-border-main overflow-x-auto">
            {assetCategories.map(cat => cat.data && cat.data.length > 0 && (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`py-2 px-3 text-sm font-semibold whitespace-nowrap ${activeCategory === cat.key ? 'tab-active-splash' : 'text-text-muted'}`}>{cat.name}</button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {currentAssets.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {currentAssets.map((asset, i) => {
                const url = typeof asset === 'string' ? asset : asset.url;
                return (
                  <div key={`${activeCategory}-${i}`} className="cursor-pointer group" onClick={() => handleSelect(url)}>
                    <img src={url} alt={`${activeCategory} asset ${i}`} className="w-full aspect-square object-contain bg-background rounded-md transition-transform group-hover:scale-105" />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-text-muted">Tidak ada aset di kategori ini.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetPickerModal;