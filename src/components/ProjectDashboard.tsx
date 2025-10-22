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
import InfoTicker from './common/InfoTicker';
import { useUserActions } from '../contexts/UserActionsContext';
import Footer from './common/Footer';
import { useUI } from '../contexts/UIContext';
import BrandCreationGate from './BrandCreationGate';

const ProjectDashboard: React.FC = () => {
    const { user } = useAuth();
    const { checkForNewAchievements, addXp } = useUserActions();
    const { toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal } = useUI();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBrandCreationGate, setShowBrandCreationGate] = useState(false);

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
            console.error('Error fetching projects:', error);
        } else {
            setProjects(data);
            if (data.length === 0) {
                setShowBrandCreationGate(true);
            } else {
                setShowBrandCreationGate(false);
                checkForNewAchievements(data.length);
                if (!selectedProject || !data.some(p => p.id === selectedProject.id)) {
                    setSelectedProject(data[0]);
                }
            }
        }
        setLoading(false);
    }, [user, selectedProject, checkForNewAchievements]);

    useEffect(() => {
        fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);
    
    const handleProjectCreated = async (wizardData: ProjectData) => {
        if (!user) return;
        setLoading(true);
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('projects')
            .insert({ user_id: user.id, project_data: wizardData })
            .select()
            .single();

        if (error) {
            console.error('Error creating project from wizard', error);
        } else {
            await addXp(250); // Big XP reward for completing the first project
            playSound('success');
            await fetchProjects(); // Re-fetch to transition from gate to dashboard
        }
        setLoading(false);
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
            if (updatedProjects.length === 0) {
                setShowBrandCreationGate(true); // Go back to gate if all projects deleted
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
    
    if (loading) {
        return <div className="min-h-screen flex justify-center items-center"><Spinner /></div>;
    }
    
    if (showBrandCreationGate) {
        return <BrandCreationGate onProjectCreated={handleProjectCreated} />;
    }

    return (
        <div className="min-h-screen bg-background text-text-body flex flex-col">
            <Header saveStatus={saveStatus} />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
                 {selectedProject ? (
                    <AICreator project={selectedProject} onUpdateProject={handleUpdateProjectData} />
                ) : (
                     <div className="text-center p-8 bg-surface rounded-2xl min-h-[50vh] flex flex-col justify-center items-center">
                        <span className="text-6xl mb-4">🤔</span>
                        <h2 className="text-3xl font-bold text-text-header mt-4" style={{fontFamily: 'var(--font-display)'}}>Pilih Proyek</h2>
                        <p className="mt-2 text-text-muted max-w-md">Pilih salah satu proyek dari garasi di bawah untuk mulai bekerja.</p>
                    </div>
                )}
            </main>
            <InfoTicker />
            <ProjectDock
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                onDeleteProject={handleDeleteProject}
                onNewProject={() => {
                    // This button should ideally not be shown if we force creation first, but as a fallback:
                    setShowBrandCreationGate(true);
                }}
                onNewVoiceProject={() => {
                    setShowBrandCreationGate(true); // Also leads to the gate
                }}
            />
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