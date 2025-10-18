// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { Project } from '../types';
import ImageModal from './common/ImageModal';
import CopyButton from './common/CopyButton';

interface LemariBrandProps {
    project: Project;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const AssetSection: React.FC<{ title: string; icon: string; children: React.ReactNode; count: number }> = ({ title, icon, children, count }) => {
    if (count === 0) {
        return (
            <div className="p-4 bg-background rounded-lg border border-border-main text-center">
                <span className="text-3xl">{icon}</span>
                <h4 className="font-bold text-text-header mt-2">{title}</h4>
                <p className="text-xs text-text-muted">Belum ada aset yang dibuat di modul ini.</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-bold text-text-header mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="text-2xl">{icon}</span>
                {title} <span className="text-sm font-sans px-2 py-0.5 bg-primary/20 text-primary rounded-full">{count}</span>
            </h3>
            {children}
        </div>
    );
};

const LemariBrand: React.FC<LemariBrandProps> = ({ project }) => {
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    const { project_data } = project;
    const { selectedLogoUrl, logoVariations, socialMediaKit, selectedSlogan, selectedPersona, sotoshop_assets } = project_data;

    const allLogoUrls = [
        selectedLogoUrl,
        logoVariations?.main,
        logoVariations?.stacked,
        logoVariations?.horizontal,
        logoVariations?.monochrome,
    ].filter((url): url is string => !!url);
    const uniqueLogos = [...new Set(allLogoUrls)];

    const allSocialKitUrls = [
        socialMediaKit?.profilePictureUrl,
        socialMediaKit?.bannerUrl,
    ].filter((url): url is string => !!url);

    return (
        <div className="space-y-8 p-1">
            <div className="text-center">
                 <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-20 h-20 mx-auto mb-2" style={{ imageRendering: 'pixelated' }} />
                <h2 className="text-2xl font-bold text-text-header">Lemari Brand: {project.project_name}</h2>
                <p className="text-text-muted">Semua hasil karyamu buat proyek ini tersimpan rapi di sini, Juragan!</p>
            </div>

            {/* Aset Inti */}
            <AssetSection title="Aset Inti Brand" icon="⭐" count={ (selectedSlogan ? 1 : 0) + (selectedPersona ? 1 : 0)}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPersona && (
                        <div className="p-4 bg-background rounded-lg">
                            <h4 className="font-semibold text-text-header text-sm mb-2">Palet Warna</h4>
                            <div className="flex items-center gap-2">
                                {selectedPersona.palet_warna_hex.map(hex => (
                                    <div key={hex} className="w-8 h-8 rounded-full border-2 border-surface" style={{ backgroundColor: hex }} title={hex} />
                                ))}
                                <CopyButton textToCopy={selectedPersona.palet_warna_hex.join(', ')} />
                            </div>
                        </div>
                    )}
                    {selectedSlogan && (
                        <div className="p-4 bg-background rounded-lg">
                            <h4 className="font-semibold text-text-header text-sm mb-2">Slogan</h4>
                            <p className="text-text-body italic">"{selectedSlogan}"</p>
                        </div>
                    )}
                </div>
            </AssetSection>

            {/* Logo */}
            <AssetSection title="Koleksi Logo" icon="🎨" count={uniqueLogos.length}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uniqueLogos.map((url, i) => (
                        <div key={i} className="bg-background p-2 rounded-lg cursor-pointer hover:ring-2 ring-primary" onClick={() => setModalImageUrl(url)}>
                            <img src={url} alt={`Logo ${i}`} className="w-full aspect-square object-contain" />
                        </div>
                    ))}
                </div>
            </AssetSection>

            {/* Kit Sosmed */}
            <AssetSection title="Kit Media Sosial" icon="📱" count={allSocialKitUrls.length}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {allSocialKitUrls.map((url, i) => (
                        <div key={i} className="bg-background p-2 rounded-lg cursor-pointer hover:ring-2 ring-primary" onClick={() => setModalImageUrl(url)}>
                            <img src={url} alt={`Aset Kit ${i}`} className="w-full aspect-video object-cover rounded-md" />
                        </div>
                    ))}
                </div>
            </AssetSection>
            
            {/* Maskot */}
            <AssetSection title="Maskot Brand" icon="🐻" count={sotoshop_assets?.mascots?.length || 0}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sotoshop_assets?.mascots?.map((url, i) => (
                        <div key={i} className="bg-background p-2 rounded-lg cursor-pointer hover:ring-2 ring-primary" onClick={() => setModalImageUrl(url)}>
                            <img src={url} alt={`Maskot ${i}`} className="w-full aspect-square object-contain" />
                        </div>
                    ))}
                </div>
            </AssetSection>
            
            {/* Pola */}
            <AssetSection title="Motif Brand" icon="🌀" count={sotoshop_assets?.patterns?.length || 0}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sotoshop_assets?.patterns?.map((pattern, i) => (
                         <div key={i} className="bg-background p-2 rounded-lg cursor-pointer hover:ring-2 ring-primary relative group" onClick={() => setModalImageUrl(pattern.url)}>
                            <div className="w-full aspect-square rounded" style={{backgroundImage: `url(${pattern.url})`, backgroundSize: '50% 50%'}} />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center p-2 transition-opacity">
                                <p className="text-white text-xs text-center">{pattern.prompt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </AssetSection>

            {/* Foto Produk */}
            <AssetSection title="Foto Produk Studio" icon="📸" count={sotoshop_assets?.productPhotos?.length || 0}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {sotoshop_assets?.productPhotos?.map((photo, i) => (
                        <div key={i} className="bg-background p-2 rounded-lg cursor-pointer hover:ring-2 ring-primary relative group" onClick={() => setModalImageUrl(photo.url)}>
                            <img src={photo.url} alt={`Foto ${i}`} className="w-full aspect-square object-cover rounded-md" />
                             <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center p-2 transition-opacity">
                                <p className="text-white text-xs text-center">{photo.prompt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </AssetSection>


            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Aset" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default LemariBrand;