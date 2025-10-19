// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, lazy } from 'react';
import type { Project, ProjectData } from '../types';
import ModuleLoader from './common/ModuleLoader';
import { useUI } from '../contexts/UIContext';

// Lazy load the main components
const BrandPersonaGenerator = lazy(() => import('./BrandPersonaGenerator'));
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const LemariBrand = lazy(() => import('./LemariBrand'));

// Lazy load Sotoshop tools
const MascotGenerator = lazy(() => import('./MascotGenerator'));
const MoodboardGenerator = lazy(() => import('./MoodboardGenerator'));
const PatternGenerator = lazy(() => import('./PatternGenerator'));
const PhotoStudio = lazy(() => import('./PhotoStudio'));
const SceneMixer = lazy(() => import('./SceneMixer'));
const VideoGenerator = lazy(() => import('./VideoGenerator'));
const AiPresenter = lazy(() => import('./AiPresenter'));

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const MAIN_TABS = ['Persona', 'Logo', 'Kit Sosmed', 'Konten', 'Lemari Brand'];
const SOTOSHOP_TABS = ['Maskot', 'Vibe Brand', 'Motif', 'Studio Foto', 'Scene Mixer', 'Video', 'AI Presenter'];

const AICreator: React.FC<{ project: Project | null; onUpdateProject: (data: Partial<ProjectData>) => Promise<void>; }> = ({ project, onUpdateProject }) => {
    const [activeTab, setActiveTab] = useState('Persona');
    const { crossComponentPrompt, setCrossComponentPrompt } = useUI();
    const [initialSotoshopPrompt, setInitialSotoshopPrompt] = useState<string | null>(null);

    useEffect(() => {
        if (project) {
            if (!project.project_data.selectedPersona) setActiveTab('Persona');
            else if (!project.project_data.selectedLogoUrl) setActiveTab('Logo');
            else setActiveTab('Kit Sosmed');
        } else {
            setActiveTab('Persona');
        }
    }, [project]);
    
    useEffect(() => {
        if (crossComponentPrompt) {
            setActiveTab(crossComponentPrompt.targetTool);
            setInitialSotoshopPrompt(crossComponentPrompt.prompt);
            setCrossComponentPrompt(null);
        }
    }, [crossComponentPrompt, setCrossComponentPrompt]);

    const renderTabContent = () => {
        if (!project) {
            return (
                 <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                    <img src={`${GITHUB_ASSETS_URL}Mang_AI_Stuck.png`} alt="Mang AI Bingung" className="w-32 h-32" style={{imageRendering: 'pixelated'}} />
                    <h2 className="text-2xl font-bold text-text-header mt-4">Pilih atau Buat Proyek Dulu, Juragan!</h2>
                    <p className="mt-2 text-text-muted">Mang AI butuh proyek untuk mulai bekerja. Silakan pilih dari daftar atau buat yang baru di sebelah kiri.</p>
                </div>
            );
        }

        const commonProps = { project, onUpdateProject };

        switch (activeTab) {
            case 'Persona': return <BrandPersonaGenerator {...commonProps} />;
            case 'Logo': return <LogoGenerator {...commonProps} />;
            case 'Kit Sosmed': return <SocialMediaKitGenerator {...commonProps} />;
            case 'Konten': return <ContentCalendarGenerator {...commonProps} />;
            case 'Lemari Brand': return <LemariBrand {...commonProps} />;
            // Sotoshop Tools
            case 'Maskot': return <MascotGenerator {...commonProps} />;
            case 'Vibe Brand': return <MoodboardGenerator {...commonProps} />;
            case 'Motif': return <PatternGenerator {...commonProps} />;
            case 'Studio Foto': return <PhotoStudio {...commonProps} initialPrompt={initialSotoshopPrompt} />;
            case 'Scene Mixer': return <SceneMixer {...commonProps} />;
            case 'Video': return <VideoGenerator {...commonProps} />;
            case 'AI Presenter': return <AiPresenter {...commonProps} />;
            default: return <div>Pilih Tab</div>;
        }
    };
    
    const isTabDisabled = (tab: string): boolean => {
        if (!project) return tab !== 'Persona';
        const { selectedPersona, selectedLogoUrl } = project.project_data;
        if (tab === 'Logo' && !selectedPersona) return true;
        if ((tab === 'Kit Sosmed' || tab === 'Konten') && (!selectedPersona || !selectedLogoUrl)) return true;
        return false;
    };
    
    const getDisabledMessage = (tab: string): string => {
        if (tab === 'Logo') return 'Lengkapi Persona dulu!';
        if (tab === 'Kit Sosmed' || tab === 'Konten') return 'Lengkapi Persona & Logo dulu!';
        return '';
    };

    const TabButton: React.FC<{ name: string, isActive: boolean, isSotoshop?: boolean }> = ({ name, isActive, isSotoshop = false }) => {
        const disabled = isTabDisabled(name);
        const title = disabled ? getDisabledMessage(name) : `Buka tab ${name}`;
        
        return (
             <button
                title={title}
                onClick={() => !disabled && setActiveTab(name)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200 border-b-2 
                    ${isActive ? 'tab-active-splash text-primary' : 'text-text-muted border-transparent hover:bg-background hover:text-text-header'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSotoshop && 'text-accent hover:text-accent-hover'}`}
            >
                {isSotoshop && '✨ '}{name}
            </button>
        )
    };

    return (
        <div className="bg-surface rounded-2xl shadow-lg" data-onboarding-step="3" data-onboarding-text="Setiap tab punya fungsi unik. Jelajahi 'Sotoshop' untuk fitur-fitur AI yang lebih canggih.">
            <div className="border-b border-border-main p-2 flex flex-wrap items-center">
                 {MAIN_TABS.map(tab => <TabButton key={tab} name={tab} isActive={activeTab === tab} />)}
                <div className="h-6 w-px bg-border-main mx-2"></div>
                {SOTOSHOP_TABS.map(tab => <TabButton key={tab} name={tab} isActive={activeTab === tab} isSotoshop />)}
            </div>
            <div className="p-4 sm:p-6 md:p-8">
                <ModuleLoader>
                    {renderTabContent()}
                </ModuleLoader>
            </div>
        </div>
    );
};

export default AICreator;
