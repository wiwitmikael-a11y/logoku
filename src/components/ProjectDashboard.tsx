// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData } from '../types';
import HeaderStats from './gamification/HeaderStats';
import ProjectSummary from './ProjectSummary';
import AICreator from './AICreator';
import Button from './common/Button';
import ThemeToggle from './common/ThemeToggle';
import Footer from './common/Footer';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ProjectDashboard: React.FC = () => {
    const { profile, projects, setProjects } = useAuth();
    const { 
        theme, toggleTheme,
        toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal,
        toggleProfileSettingsModal, togglePusatJuraganModal, toggleDailyMissionsModal
    } = useUI();
    const { checkForNewAchievements } = useUserActions();
    
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (projects.length > 0 && !selectedProject) {
            setSelectedProject(projects[0]);
        }
        checkForNewAchievements(projects.length);
    }, [projects, selectedProject, checkForNewAchievements, profile]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim() || !profile) return;
        setIsCreating(true);
        const supabase = getSupabaseClient();

        // Adjusted to store project_name inside project_data JSONB
        const initialProjectData: ProjectData = {
            project_name: newProjectName.trim(),
            brandInputs: null,
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
                             <Button onClick={() => toggleDailyMissionsModal(true)} variant="secondary" size="small">🎯 Misi Harian</Button>
                            <ThemeToggle theme={theme} onToggle={toggleTheme} />
                            <button onClick={() => toggleProfileSettingsModal(true)} title={profile?.full_name}>
                                <img src={profile?.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <HeaderStats />
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <aside className="lg:col-span-3 space-y-6">
                        <div className="p-4 bg-surface rounded-2xl">
                            <h2 className="text-lg font-bold text-text-header mb-3">Proyek Branding</h2>
                            <div className="space-y-2">
                                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Nama Proyek Baru" className="w-full bg-background border border-border-main rounded-lg px-3 py-2 text-sm"/>
                                <Button onClick={handleCreateProject} isLoading={isCreating} disabled={!newProjectName.trim()} className="w-full">Buat Proyek Baru</Button>
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
        </div>
    );
};

export default ProjectDashboard;