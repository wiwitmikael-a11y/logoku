// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData, BrandInputs } from '../types';
import ProjectSummary from './ProjectSummary';
import AICreator from './AICreator';
import Button from './common/Button';
import ThemeToggle from './common/ThemeToggle';
import Footer from './common/Footer';
import VoiceBrandingWizard from './VoiceBrandingWizard';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ProjectDashboard: React.FC = () => {
    const { profile, projects, setProjects } = useAuth();
    const { 
        theme, toggleTheme,
        toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal,
        toggleProfileSettingsModal, togglePusatJuraganModal
    } = useUI();
    const { checkForNewAchievements, lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();
    
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showVoiceWizard, setShowVoiceWizard] = useState(false);
    // State to decide if we show the "manual creation" flow for new users
    const [showManualCreateFlow, setShowManualCreateFlow] = useState(false);


    useEffect(() => {
        if (projects.length > 0 && !selectedProject) {
            setSelectedProject(projects[0]);
        }
        checkForNewAchievements(projects.length);
    }, [projects, selectedProject, checkForNewAchievements, profile]);

    const handleCreateProject = async (name: string, initialInputs?: BrandInputs) => {
        if (!name.trim() || !profile) return;
        setIsCreating(true);
        const supabase = getSupabaseClient();

        const initialProjectData: ProjectData = {
            project_name: name.trim(),
            brandInputs: initialInputs || null,
            slogans: [],
            selectedSlogan: null,
            logoPrompt: null,
            logoOptions: [],
            selectedLogoUrl: null,
            logoVariations: [],
            brandPersonas: [],
            selectedPersona: null,
            socialMediaKit: null,
            socialProfiles: null,
            contentCalendar: null,
        };

        const { data, error } = await supabase
            .from('projects')
            .insert({ 
                user_id: profile.id, 
                project_data: initialProjectData 
            })
            .select()
            .single();

        if (error) {
            console.error("Gagal membuat proyek:", error);
        } else if (data) {
            setProjects(prev => [data, ...prev]);
            setSelectedProject(data);
            setNewProjectName('');
        }
        setIsCreating(false);
    };

    // Auto-create project after voice consultation
    useEffect(() => {
        if (lastVoiceConsultationResult && lastVoiceConsultationResult.businessName) {
            handleCreateProject(lastVoiceConsultationResult.businessName, lastVoiceConsultationResult);
            setLastVoiceConsultationResult(null); // Clear the result after processing
        }
    }, [lastVoiceConsultationResult, setLastVoiceConsultationResult]);


    const handleUpdateProjectData = async (data: Partial<ProjectData>) => {
        if (!selectedProject) return;
        const supabase = getSupabaseClient();
        const updatedProjectData = { ...selectedProject.project_data, ...data };
        const { data: updatedProject, error } = await supabase
            .from('projects')
            .update({ project_data: updatedProjectData })
            .eq('id', selectedProject.id)
            .select()
            .single();
        
        if (error) throw new Error(`Gagal menyimpan progres: ${error.message}`);

        if (updatedProject) {
            setSelectedProject(updatedProject);
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        }
    };

    // --- RENDER LOGIC ---

    // New User Welcome Screen
    if (projects.length === 0 && !showManualCreateFlow && !isCreating) {
        return (
             <>
                <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background text-text-body">
                     <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-32 h-32 mx-auto mb-4 animate-breathing-ai" style={{imageRendering: 'pixelated'}}/>
                    <h2 className="text-4xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Selamat Datang, Juragan!</h2>
                    <p className="text-text-body mt-2 mb-8 max-w-xl">Ayo kita mulai bangun brand juaramu. Pilih cara yang paling asik buat mulai:</p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <div onClick={() => setShowVoiceWizard(true)} className="w-full sm:w-72 p-8 rounded-lg text-center cursor-pointer selection-card selection-card-active">
                            <span className="text-6xl">🎙️</span>
                            <h3 className="font-bold text-xl mt-4 text-text-header">Konsultasi Suara</h3>
                            <p className="text-sm text-text-muted mt-2">Ngobrol interaktif sama Mang AI buat gali DNA brand-mu. <strong className="text-primary">(Paling Direkomendasikan)</strong></p>
                        </div>
                        <div onClick={() => setShowManualCreateFlow(true)} className="w-full sm:w-72 p-8 rounded-lg text-center cursor-pointer selection-card">
                            <span className="text-6xl">✍️</span>
                            <h3 className="font-bold text-xl mt-4 text-text-header">Mulai Manual</h3>
                            <p className="text-sm text-text-muted mt-2">Lebih suka ngetik? Isi detail brand-mu sendiri lewat form yang udah disiapin.</p>
                        </div>
                    </div>
                </div>
                <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} />
                <Footer onShowAbout={() => toggleAboutModal(true)} onShowContact={() => toggleContactModal(true)} onShowToS={() => toggleToSModal(true)} onShowPrivacy={() => togglePrivacyModal(true)}/>
            </>
        );
    }


    return (
        <div className="min-h-screen bg-background text-text-body">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border-main">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h1>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={() => togglePusatJuraganModal(true)} variant="secondary" size="small">Pusat Juragan</Button>
                            <ThemeToggle theme={theme} onToggle={toggleTheme} />
                            <button onClick={() => toggleProfileSettingsModal(true)} title={profile?.full_name}>
                                <img src={profile?.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <aside className="lg:col-span-3 space-y-6">
                        <div className="p-4 bg-surface rounded-2xl">
                            <h2 className="text-lg font-bold text-text-header mb-3">Proyek Branding</h2>
                            <div className="space-y-2">
                                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Nama Proyek Baru" className="w-full bg-background border border-border-main rounded-lg px-3 py-2 text-sm"/>
                                <Button onClick={() => handleCreateProject(newProjectName)} isLoading={isCreating} disabled={!newProjectName.trim()} className="w-full">Buat Proyek Baru</Button>
                            </div>
                            <hr className="my-4 border-border-main" />
                             <div className="space-y-2 max-h-60 overflow-y-auto">
                                {projects.map(p => (
                                    <button key={p.id} onClick={() => setSelectedProject(p)} className={`w-full text-left p-2 rounded-md text-sm ${selectedProject?.id === p.id ? 'bg-primary text-white font-semibold' : 'hover:bg-background'}`}>
                                        {p.project_data.project_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ProjectSummary project={selectedProject} />
                    </aside>

                    <div className="lg:col-span-9">
                        <AICreator project={selectedProject} onUpdateProject={handleUpdateProjectData} />
                    </div>
                </div>
            </main>

            <Footer onShowAbout={() => toggleAboutModal(true)} onShowContact={() => toggleContactModal(true)} onShowToS={() => toggleToSModal(true)} onShowPrivacy={() => togglePrivacyModal(true)}/>
             <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} />
        </div>
    );
};

export default ProjectDashboard;