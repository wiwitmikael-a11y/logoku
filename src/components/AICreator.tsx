// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, lazy } from 'react';
import type { Project, ProjectData } from '../types';
import ModuleLoader from './common/ModuleLoader';
import { useUI } from '../contexts/UIContext';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';

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

const MAIN_TABS = ['Persona', 'Logo', 'Kit Sosmed', 'Konten', 'Lemari Brand'];
const SOTOSHOP_TABS = ['Maskot', 'Vibe Brand', 'Motif', 'Studio Foto', 'Scene Mixer', 'Video', 'AI Presenter'];

const AICreator: React.FC<{ project: Project | null; onUpdateProject: (data: Partial<ProjectData>) => Promise<void>; }> = ({ project, onUpdateProject }) => {
    const [activeTab, setActiveTab] = useState('Persona');
    const { crossComponentPrompt, setCrossComponentPrompt } = useUI();
    const [initialSotoshopPrompt, setInitialSotoshopPrompt] = useState<string | null>(null);
    
    // Activate the "Asisten Pencatat"
    const saveStatus = useDebouncedAutosave(project, onUpdateProject);

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
                    <div className="mx-auto mb-4 w-32 h-32 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
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
    
    const AutosaveIndicator = () => {
        let text = null;
        if (saveStatus === 'SAVING') text = "Menyimpan...";
        if (saveStatus === 'SAVED') text = "✓ Semua perubahan disimpan";

        if (!text) return null;

        return (
            <div className="text-xs text-text-muted transition-opacity duration-300">
                {text}
            </div>
        );
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
        <div className="bg-surface rounded-2xl shadow-lg">
            <div className="border-b border-border-main p-2 flex flex-wrap items-center justify-between">
                 <div className="flex flex-wrap items-center">
                    {MAIN_TABS.map(tab => <TabButton key={tab} name={tab} isActive={activeTab === tab} />)}
                    <div className="h-6 w-px bg-border-main mx-2"></div>
                    {SOTOSHOP_TABS.map(tab => <TabButton key={tab} name={tab} isActive={activeTab === tab} isSotoshop />)}
                 </div>
                 <div className="px-4">
                    <AutosaveIndicator />
                 </div>
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