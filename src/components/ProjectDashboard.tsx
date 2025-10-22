// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData } from '../types';
import AICreator from './AICreator';
import Spinner from './common/Spinner';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';
import { playSound } from '../services/soundService';
import { useUserActions } from '../contexts/UserActionsContext';
import BrandCreationGate from './BrandCreationGate';
import DashboardHeader from './DashboardHeader';
import { useProject } from '../contexts/ProjectContext';

const ProjectDashboard: React.FC = () => {
    const { user } = useAuth();
    const { checkForNewAchievements, addXp } = useUserActions();
    const { 
        projects, 
        selectedProject, 
        loading, 
        fetchProjects, 
        handleUpdateProjectData,
        setSelectedProjectById 
    } = useProject();
    
    const [showBrandCreationGate, setShowBrandCreationGate] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (projects.length === 0) {
            setShowBrandCreationGate(true);
        } else {
            setShowBrandCreationGate(false);
            checkForNewAchievements(projects.length);
            if (!selectedProject || !projects.some(p => p.id === selectedProject.id)) {
                setSelectedProjectById(projects[0].id);
            }
        }
    }, [projects, loading, checkForNewAchievements, selectedProject, setSelectedProjectById]);
    
    const handleProjectCreated = async (wizardData: ProjectData) => {
        if (!user) return;
        
        const supabase = getSupabaseClient();
        const { error } = await supabase
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
    };

    const onSave = async (data: Partial<ProjectData>) => {
        if (!selectedProject) return;
        const supabase = getSupabaseClient();
        await supabase.from('projects').update({ project_data: data }).eq('id', selectedProject.id);
    };

    useDebouncedAutosave(selectedProject, onSave);
    
    if (loading) {
        return <div className="min-h-screen flex justify-center items-center"><Spinner /></div>;
    }
    
    if (showBrandCreationGate) {
        return <BrandCreationGate onProjectCreated={handleProjectCreated} />;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
                 {selectedProject ? (
                    <AICreator project={selectedProject} onUpdateProject={handleUpdateProjectData} />
                ) : (
                     <div className="text-center p-8 bg-surface rounded-2xl min-h-[50vh] flex flex-col justify-center items-center">
                        <span className="text-6xl mb-4">🤔</span>
                        <h2 className="text-3xl font-bold text-text-header mt-4" style={{fontFamily: 'var(--font-display)'}}>Pilih Proyek</h2>
                        <p className="mt-2 text-text-muted max-w-md">Pilih salah satu proyek dari sidebar di sebelah kiri untuk mulai bekerja.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProjectDashboard;