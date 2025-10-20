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
import Button from './common/Button';

const ProjectDock: React.FC<{
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  isCreating: boolean;
}> = ({ projects, selectedProject, onSelectProject, onCreateProject, isCreating }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-surface rounded-2xl shadow-lg transition-all duration-300 ease-in-out">
      <div className="p-4 border-b border-border-main flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-text-header">Proyek Juragan</h2>
          <p className="text-xs text-text-muted">{selectedProject ? `Terpilih: ${selectedProject.project_data.project_name}` : 'Pilih atau buat proyek baru'}</p>
        </div>
        <Button onClick={() => setIsExpanded(!isExpanded)} size="small" variant="secondary">
          {isExpanded ? 'Ciutkan' : 'Bentangkan'}
        </Button>
      </div>
      {isExpanded && (
        <div className="p-4 space-y-3 animate-content-fade-in">
          <Button onClick={onCreateProject} isLoading={isCreating} className="w-full">
            + Proyek Baru
          </Button>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`w-full text-left p-3 rounded-lg text-sm font-semibold transition-colors ${selectedProject?.id === p.id ? 'bg-primary text-white shadow-md' : 'bg-background hover:bg-border-light'}`}
              >
                {p.project_data.project_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


const ProjectDashboard: React.FC = () => {
    const { profile, projects, setProjects } = useAuth();
    const { 
        toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal, 
        toggleProfileSettingsModal, togglePusatJuraganModal, toggleDailyMissionsModal
    } = useUI();
    const { addXp, lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();
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

        // Update local state immediately for responsiveness
        setSelectedProject(updatedProject);
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        
        // Persist to DB
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
                             <button onClick={() => toggleDailyMissionsModal(true)} title="Misi Harian" className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">🎯</button>
                             <button onClick={() => togglePusatJuraganModal(true)} title="Pusat Juragan" className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">🏆</button>
                            <button onClick={() => toggleProfileSettingsModal(true)} title="Pengaturan & Profil" className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">
                                <img src={profile?.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full" />
                            </button>
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
                        {/* FIX: Pass the handleCreateNewProject function down to enable the VoiceBrandingWizard. */}
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
