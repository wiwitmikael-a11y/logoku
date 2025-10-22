// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData, BrandInputs } from '../types';
import ProjectDock from './ProjectDock';
import AICreator from './AICreator';
import Spinner from './common/Spinner';
import Header from './gamification/HeaderStats';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';
import { playSound } from '../services/soundService';
import Onboarding from './common/Onboarding';
import InfoTicker from './common/InfoTicker';
import VoiceBrandingWizard from './VoiceBrandingWizard';
import { useUserActions } from '../contexts/UserActionsContext';

const ProjectDashboard: React.FC = () => {
    const { user, isNewUser } = useAuth();
    const { checkForNewAchievements } = useUserActions();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showVoiceWizard, setShowVoiceWizard] = useState(false);

    const fetchProjects = useCallback(async () => {
        if (!user) return;
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching projects:', error);
        } else {
            setProjects(data);
            checkForNewAchievements(data.length);
            if (!selectedProject && data.length > 0) {
                setSelectedProject(data[0]);
            } else if (data.length === 0) {
                setSelectedProject(null);
            }
        }
        setLoading(false);
    }, [user, selectedProject, checkForNewAchievements]);

    useEffect(() => {
        fetchProjects();
        if (isNewUser) {
           setTimeout(() => setShowOnboarding(true), 1000); // Delay for UI to settle
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isNewUser]);

    const handleNewProject = async () => {
        if (!user) return;
        const projectName = `Proyek Tanpa Judul ${projects.length + 1}`;
        const newProjectData: ProjectData = {
            project_name: projectName,
            brandInputs: { businessName: projectName, businessDetail: '', industry: '', targetAudience: '', valueProposition: '', competitorAnalysis: '' },
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

        if (error) console.error('Error creating project', error);
        else {
            setProjects([data, ...projects]);
            setSelectedProject(data);
            playSound('success');
        }
    };
    
    const handleNewVoiceProject = async (projectName: string, initialInputs: BrandInputs | null) => {
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

        if (error) {
            console.error('Error creating voice project', error);
        } else {
            setProjects([data, ...projects]);
            setSelectedProject(data);
            playSound('success');
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!window.confirm("Yakin mau hapus proyek ini? Nggak bisa dibalikin lho.")) return;
        
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) console.error("Error deleting project", error);
        else {
            const updatedProjects = projects.filter(p => p.id !== projectId);
            setProjects(updatedProjects);
            if (selectedProject?.id === projectId) {
                setSelectedProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
            }
            playSound('error');
        }
    };

    const handleUpdateProjectData = useCallback(async (data: Partial<ProjectData>) => {
        if (!selectedProject) return;
        // Optimistic update
        const updatedProject = {
            ...selectedProject,
            project_data: {
                ...selectedProject.project_data,
                ...data
            }
        };
        setSelectedProject(updatedProject);
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    }, [selectedProject, projects]);

    const onSave = async (data: Partial<ProjectData>) => {
        if (!selectedProject) return;
        const supabase = getSupabaseClient();
        await supabase.from('projects').update({ project_data: data }).eq('id', selectedProject.id);
    };

    const saveStatus = useDebouncedAutosave(selectedProject, onSave);

    return (
        <div className="min-h-screen bg-background text-text-body">
            <Header saveStatus={saveStatus} />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-32">
                {loading ? (
                    <div className="flex justify-center items-center h-[50vh]"><Spinner /></div>
                ) : selectedProject ? (
                    <AICreator project={selectedProject} onUpdateProject={handleUpdateProjectData} />
                ) : (
                    <div className="text-center p-8 bg-surface rounded-2xl min-h-[50vh] flex flex-col justify-center items-center">
                        <span className="text-6xl mb-4">🚀</span>
                        <h2 className="text-3xl font-bold text-text-header mt-4" style={{fontFamily: 'var(--font-display)'}}>Selamat Datang, Juragan!</h2>
                        <p className="mt-2 text-text-muted max-w-md">Kelihatannya lo belum punya proyek. Buat proyek pertamamu di dok bawah untuk memulai petualangan branding!</p>
                    </div>
                )}
            </main>
            <InfoTicker />
            <ProjectDock
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                onDeleteProject={handleDeleteProject}
                onNewProject={handleNewProject}
                onNewVoiceProject={() => setShowVoiceWizard(true)}
            />
            {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
            <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} onCreateProject={handleNewVoiceProject} />
        </div>
    );
};

export default ProjectDashboard;
