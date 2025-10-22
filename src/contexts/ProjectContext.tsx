// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import type { Project, ProjectData } from '../types';

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  setSelectedProjectById: (id: string) => void;
  createNewProject: (projectData: ProjectData) => Promise<Project | null>;
  updateProject: (projectId: string, data: Partial<ProjectData>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setSelectedProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = getSupabaseClient();
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fetchedProjects = data || [];
      setProjects(fetchedProjects);
      
      const lastSelectedId = localStorage.getItem(`desainfun_last_project_${user.id}`);
      const projectToSelect = fetchedProjects.find(p => p.id === lastSelectedId) || fetchedProjects[0] || null;
      setSelectedProject(projectToSelect);

    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      setSelectedProject(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  const refreshProjects = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  const setSelectedProjectById = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setSelectedProject(project);
      if (user) {
         localStorage.setItem(`desainfun_last_project_${user.id}`, id);
      }
    }
  };

  const createNewProject = async (projectData: ProjectData): Promise<Project | null> => {
    if (!user) return null;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, project_data: projectData })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }
    
    if (data) {
        await fetchProjects(); // Refetch to update the list
        setSelectedProjectById(data.id); // Select the new project
        return data;
    }
    return null;
  };
  
  const updateProject = async (projectId: string, data: Partial<ProjectData>) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
          .from('projects')
          .update({ project_data: data })
          .eq('id', projectId);

      if (error) throw error;
      
      // Update local state for immediate feedback
      const updatedProjectData = data as ProjectData;
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, project_data: updatedProjectData } : p));
      if (selectedProject?.id === projectId) {
          setSelectedProject(prev => prev ? { ...prev, project_data: updatedProjectData } : null);
      }
  };
  
  const deleteProject = async (projectId: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
    await fetchProjects(); // Refetch to update list and selection
  };
  
  const value = {
    projects,
    selectedProject,
    loading,
    setSelectedProjectById,
    createNewProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
