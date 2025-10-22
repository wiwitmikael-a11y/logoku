// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData } from '../types';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  setSelectedProjectById: (projectId: string) => void;
  handleUpdateProjectData: (data: Partial<ProjectData>) => Promise<void>;
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
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } else {
      setProjects(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  // This separate effect handles selection logic when projects list changes, avoiding loops.
  useEffect(() => {
      if (projects.length > 0) {
          setSelectedProject(currentSelected => {
              // If there's no selection, or the current selection is no longer in the list, pick the first one.
              if (!currentSelected || !projects.some(p => p.id === currentSelected.id)) {
                  return projects[0];
              }
              // Otherwise, find the potentially updated version of the current selection from the new list.
              return projects.find(p => p.id === currentSelected.id) || projects[0];
          });
      } else {
          setSelectedProject(null);
      }
  }, [projects]);


  const setSelectedProjectById = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  const handleUpdateProjectData = useCallback((data: Partial<ProjectData>): Promise<void> => {
    return new Promise((resolve) => {
        setSelectedProject(currentSelected => {
          if (!currentSelected) {
              resolve();
              return null;
          }
          const updatedProject = {
            ...currentSelected,
            project_data: {
              ...currentSelected.project_data,
              ...data
            }
          };
          
          setProjects(prevProjects => 
            prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
          );
          
          resolve();
          return updatedProject;
        });
    });
  }, []);

  const value: ProjectContextType = {
    projects,
    selectedProject,
    loading,
    fetchProjects,
    setSelectedProjectById,
    handleUpdateProjectData,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};