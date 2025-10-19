// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import JSZip from 'jszip';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateSocialMediaKitAssets, generateSocialProfiles } from '../services/geminiService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';
import CopyButton from './common/CopyButton';

const VISUAL_KIT_COST = 5;
const TEXT_KIT_COST = 3;
const XP_REWARD = 100;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const SocialMediaKitGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { deductCredits, addXp } = useUserActions();
    const [isLoadingVisuals, setIsLoadingVisuals] = useState(false);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { selectedPersona, selectedLogoUrl, socialMediaKit, socialProfiles } = project.project_data;

    const handleGenerateVisuals = async () => {
        if (!selectedPersona || !selectedLogoUrl) return;

        setIsLoadingVisuals(true);
        setError(null);
        try {
            if (!(await deductCredits(VISUAL_KIT_COST))) return;

            const assets = await generateSocialMediaKitAssets(project.project_data);
            await onUpdateProject({ socialMediaKit: assets });
            await addXp(XP_REWARD / 2);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat aset visual.');
            playSound('error');
        } finally {
            setIsLoadingVisuals(false);
        }
    };
    
    const handleGenerateProfiles = async () => {
        if (!selectedPersona || !project.project_data.brandInputs) return;

        setIsLoadingProfiles(true);
        setError(null);
        try {
            if (!(await deductCredits(TEXT_KIT_COST))) return;

            const profiles = await generateSocialProfiles(project.project_data.brandInputs, selectedPersona);
            await onUpdateProject({ socialProfiles: profiles });
            await addXp(XP_REWARD / 2);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat profil teks.');
            playSound('error');
        } finally {
            setIsLoadingProfiles(false);
        }
    };

    const handleDownloadAll = async () => {
        if (!socialMediaKit) return;
        const zip = new JSZip();
        
        const fetchAndZip = async (url: string, filename: string) => {
            const response = await fetch(url);
            const blob = await response.blob();
            zip.file(filename, blob);
        };
        
        await Promise.all([
            fetchAndZip(socialMediaKit.profilePictureUrl, 'profile_picture.webp'),
            fetchAndZip(socialMediaKit.bannerUrl, 'banner.webp')
        ]);

        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${project.project_data.project_name}_social_kit.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    if (!selectedPersona || !selectedLogoUrl) {
        return (
            <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <span className="text-5xl mb-4">🎨</span>
                <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Persona & Logo Dulu!</h2>
                <p className="mt-2 text-text-muted max-w-md">Kit Media Sosial perlu acuan dari Persona dan Logo yang sudah final. Silakan lengkapi langkah 1 & 2 di tab sebelumnya, Juragan.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <div>
                    <h4 className="font-bold text-text-header">Paket Siap Tempur!</h4>
                    <p className="text-sm text-text-body mt-1">Ini dia amunisi buat sosmed-mu. Mang AI bikinin foto profil, banner, sampe bio-bio keren yang tinggal copas. Biar profilmu keliatan pro dan konsisten di mana-mana!</p>
                </div>
            </div>

            {error && <ErrorMessage message={error}/>}

            {/* Visual Kit Section */}
            <div className="p-6 bg-surface rounded-lg">
                <h3 className="text-2xl font-bold text-text-header mb-4" style={{fontFamily: 'var(--font-display)'}}>1. Aset Visual</h3>
                {!socialMediaKit ? (
                     <div className="text-center">
                        <p className="text-text-muted mb-4">Buat foto profil dan banner yang serasi dengan logo dan persona brand-mu.</p>
                        <Button onClick={handleGenerateVisuals} isLoading={isLoadingVisuals} variant="primary">
                            Buat Aset Visual! ({VISUAL_KIT_COST} Token)
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-content-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold text-text-header mb-2">Foto Profil</p>
                                <img src={socialMediaKit.profilePictureUrl} alt="Profile" className="w-full aspect-square object-cover rounded-lg" />
                            </div>
                             <div>
                                <p className="font-semibold text-text-header mb-2">Banner / Header</p>
                                <img src={socialMediaKit.bannerUrl} alt="Banner" className="w-full aspect-video object-cover rounded-lg" />
                            </div>
                        </div>
                         <Button onClick={handleDownloadAll} variant="secondary" size="small">
                            Unduh Semua (.zip)
                        </Button>
                    </div>
                )}
            </div>

            {/* Text Profile Section */}
             <div className="p-6 bg-surface rounded-lg">
                <h3 className="text-2xl font-bold text-text-header mb-4" style={{fontFamily: 'var(--font-display)'}}>2. Teks Profil & Bio</h3>
                 {!socialProfiles ? (
                     <div className="text-center">
                        <p className="text-text-muted mb-4">Dapatkan bio Instagram, TikTok, dan deskripsi marketplace yang menjual.</p>
                        <Button onClick={handleGenerateProfiles} isLoading={isLoadingProfiles} variant="primary">
                            Buat Teks Profil! ({TEXT_KIT_COST} Token)
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-content-fade-in">
                        <ProfileDisplay title="Bio Instagram" text={socialProfiles.instagramBio} />
                        <ProfileDisplay title="Bio TikTok" text={socialProfiles.tiktokBio} />
                        <ProfileDisplay title="Deskripsi Marketplace" text={socialProfiles.marketplaceDescription} />
                    </div>
                )}
            </div>
        </div>
    );
};

const ProfileDisplay: React.FC<{title: string, text: string}> = ({title, text}) => (
    <div className="p-3 bg-background rounded-lg">
        <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-sm text-text-header">{title}</h4>
            <CopyButton textToCopy={text} />
        </div>
        <p className="text-sm text-text-body whitespace-pre-wrap selectable-text">{text}</p>
    </div>
);

export default SocialMediaKitGenerator;