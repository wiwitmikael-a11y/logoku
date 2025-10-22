// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData, BrandInputs } from '../types';
import HeaderStats from './gamification/HeaderStats';
import AICreator from './AICreator';
import ProjectSummary from './ProjectSummary';
import Footer from './common/Footer';
import Tooltip from './common/Tooltip';
import ProjectDock from './ProjectDock';

const ProjectDashboard: React.FC = () => {
    const { profile, projects, setProjects } = useAuth();
    const { 
        toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal, 
        toggleProfileSettingsModal, togglePusatJuraganModal, toggleDailyMissionsModal
    } = useUI();
    const { addXp } = useUserActions();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (projects.length > 0 && !selectedProject) {
            setSelectedProject(projects[0]);
        } else if (projects.length === 0) {
            setSelectedProject(null);
        }
    }, [projects, selectedProject]);

    const handleCreateNewProject = async (projectName: string, initialInputs: BrandInputs | null = null) => {
        if (!profile) return;
        setIsCreating(true);
        const supabase = getSupabaseClient();
        const initialData: ProjectData = {
            project_name: projectName,
            brandInputs: initialInputs,
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
            sotoshop_assets: {
                mascots: [],
                moodboards: [],
                patterns: [],
                photoStudio: [],
                sceneMixes: [],
                videos: [],
                aiPresenter: [],
            },
        };

        const { data, error } = await supabase
            .from('projects')
            .insert({ user_id: profile.id, project_data: initialData })
            .select()
            .single();

        if (error) {
            console.error("Error creating project:", error);
        } else if (data) {
            const newProjects = [data, ...projects];
            setProjects(newProjects);
            setSelectedProject(data);
            await addXp(50);
        }
        setIsCreating(false);
    };

    const handleCreateClick = () => {
        const name = prompt("Nama proyek barunya apa, Juragan?");
        if (name) handleCreateNewProject(name, null);
    };

    const handleUpdateProject = useCallback(async (updatedData: Partial<ProjectData>) => {
        if (!selectedProject) return;
        
        const updatedProject = {
            ...selectedProject,
            project_data: {
                ...selectedProject.project_data,
                ...updatedData
            }
        };

        setSelectedProject(updatedProject);
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        
        const supabase = getSupabaseClient();
        await supabase
            .from('projects')
            .update({ project_data: updatedProject.project_data })
            .eq('id', selectedProject.id);

    }, [selectedProject, projects, setProjects]);

    return (
        <div className="min-h-screen bg-background text-text-body">
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h1>
                        <div className="flex items-center gap-2">
                            <Tooltip text="Misi Harian">
                                <button onClick={() => toggleDailyMissionsModal(true)} className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">🎯</button>
                            </Tooltip>
                             <Tooltip text="Pusat Juragan">
                                <button onClick={() => togglePusatJuraganModal(true)} className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">🏆</button>
                             </Tooltip>
                            <Tooltip text="Profil & Pengaturan">
                                <button onClick={() => toggleProfileSettingsModal(true)} className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">
                                    <img src={profile?.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                    <HeaderStats />
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <ProjectDock
                    projects={projects}
                    selectedProject={selectedProject}
                    onSelectProject={setSelectedProject}
                    onCreateProject={handleCreateClick}
                    isCreating={isCreating}
                />
                <div className="flex flex-col lg:flex-row gap-8">
                     <div className="lg:order-2 flex-grow">
                        <AICreator project={selectedProject} onUpdateProject={handleUpdateProject} onCreateProject={handleCreateNewProject} />
                    </div>
                    <div className="lg:order-1 lg:w-72 flex-shrink-0">
                        <div className="lg:sticky top-24">
                           <ProjectSummary project={selectedProject} />
                        </div>
                    </div>
                </div>
            </main>

            <Footer 
                onShowAbout={() => toggleAboutModal(true)} 
                onShowContact={() => toggleContactModal(true)}
                onShowToS={() => toggleToSModal(true)}
                onShowPrivacy={() => togglePrivacyModal(true)}
            />
        </div>
    );
};

export default ProjectDashboard;
