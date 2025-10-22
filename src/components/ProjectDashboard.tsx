// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData, BrandInputs } from '../types';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';
import Header from './gamification/HeaderStats';
import AICreator from './AICreator';
import ProjectDock from './ProjectDock';
import Spinner from './common/Spinner';
import Onboarding from './common/Onboarding';
import DeleteProjectSliderModal from './common/DeleteProjectSliderModal';
import VoiceBrandingWizard from './VoiceBrandingWizard';
import InfoTicker from './common/InfoTicker';
import Footer from './common/Footer';
import { useUI } from '../contexts/UIContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';

const ProjectDashboard: React.FC = () => {
    const { user, isNewUser } = useAuth();
    const {
        toggleAboutModal,
        toggleContactModal,
        toggleToSModal,
        togglePrivacyModal,
    } = useUI();
    const { checkForNewAchievements } = useUserActions();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [showVoiceWizard, setShowVoiceWizard] = useState(false);

    const fetchProjects = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching projects:", error);
            setProjects([]);
        } else {
            setProjects(data);
            if (data.length > 0 && !selectedProject) {
                setSelectedProject(data[0]);
            } else if (data.length === 0) {
                setSelectedProject(null);
            }
            checkForNewAchievements(data.length);
        }
        setLoading(false);
    }, [user, selectedProject, checkForNewAchievements]);

    useEffect(() => {
        fetchProjects();
    }, [user]);
    
    useEffect(() => {
        if (isNewUser && projects.length === 0) {
            const timer = setTimeout(() => setShowOnboarding(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [isNewUser, projects.length]);

    const handleUpdateProject = useCallback(async (updatedData: Partial<ProjectData>) => {
        if (!selectedProject) return;

        const updatedProject = {
            ...selectedProject,
            project_data: {
                ...selectedProject.project_data,
                ...updatedData,
            },
        };

        setSelectedProject(updatedProject);
        // The autosave hook will handle the actual database update
    }, [selectedProject]);
    
    const saveToDb = useCallback(async (projectData: Partial<ProjectData>) => {
        if (!selectedProject) return;
         const supabase = getSupabaseClient();
         await supabase
            .from('projects')
            .update({ project_data: projectData })
            .eq('id', selectedProject.id);
    }, [selectedProject]);

    const saveStatus = useDebouncedAutosave(selectedProject, saveToDb);

    const createNewProject = async (projectName: string, initialInputs: BrandInputs | null) => {
        if (!user) return;
        const newProjectData: ProjectData = {
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
        };
       const supabase = getSupabaseClient();
       const { data, error } = await supabase
           .from('projects')
           .insert({ user_id: user.id, project_data: newProjectData })
           .select()
           .single();
       
       if (!error && data) {
           setProjects([data, ...projects]);
           setSelectedProject(data);
           playSound('success');
       }
   };

    const handleNewProject = async () => {
         if (!user) return;
         const projectName = `Proyek Tanpa Judul ${projects.length + 1}`;
         await createNewProject(projectName, null);
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('projects').delete().eq('id', projectToDelete);
        if (!error) {
            const newProjects = projects.filter(p => p.id !== projectToDelete);
            setProjects(newProjects);
            if (selectedProject?.id === projectToDelete) {
                setSelectedProject(newProjects.length > 0 ? newProjects[0] : null);
            }
        }
        setProjectToDelete(null);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header saveStatus={saveStatus} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-[50vh]"><Spinner /></div>
                ) : selectedProject ? (
                    <AICreator project={selectedProject} onUpdateProject={handleUpdateProject} />
                ) : (
                    <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                        <span className="text-5xl mb-4">🚀</span>
                        <h2 className="text-2xl font-bold text-text-header mt-4">Selamat Datang, Juragan!</h2>
                        <p className="mt-2 text-text-muted max-w-md">Kamu belum punya proyek. Buat proyek pertamamu sekarang untuk mulai membangun brand impianmu!</p>
                        <div className="mt-6 flex gap-4">
                            <Button onClick={handleNewProject} variant="primary">Buat Proyek Baru</Button>
                            <Button onClick={() => setShowVoiceWizard(true)} variant="secondary">🎙️ Mulai dengan Suara</Button>
                        </div>
                    </div>
                )}
            </main>
            <Footer 
                 onShowAbout={() => toggleAboutModal(true)}
                 onShowContact={() => toggleContactModal(true)}
                 onShowToS={() => toggleToSModal(true)}
                 onShowPrivacy={() => togglePrivacyModal(true)}
            />
            {!loading && (
                <ProjectDock 
                    projects={projects}
                    selectedProject={selectedProject}
                    onSelectProject={setSelectedProject}
                    onDeleteProject={setProjectToDelete}
                    onNewProject={handleNewProject}
                    onNewVoiceProject={() => setShowVoiceWizard(true)}
                />
            )}
            {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
            {projectToDelete && <DeleteProjectSliderModal show={!!projectToDelete} onClose={() => setProjectToDelete(null)} onDelete={handleDeleteProject} />}
            <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} onCreateProject={createNewProject} />
            <InfoTicker />
        </div>
    );
};

export default ProjectDashboard;
