// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { Project } from '../../types';

interface Props {
  currentProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
}

const ProjectSwitcher: React.FC<Props> = ({ currentProjectId, onProjectSelect }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data } = await supabase.from('projects').select('id, project_data(project_name)').order('created_at', { ascending: false });
      setProjects((data as any[]) || []);
      setLoading(false);
    };
    fetchProjects();
  }, [user]);

  if (loading) return <p>Loading projects...</p>;

  return (
    <select
      value={currentProjectId || ''}
      onChange={(e) => onProjectSelect(e.target.value)}
      className="w-full bg-surface border border-border-main rounded-lg px-3 py-2 text-text-body focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="" disabled>Pilih Proyek...</option>
      {projects.map(p => (
        <option key={p.id} value={p.id}>
          {p.project_data.project_name}
        </option>
      ))}
    </select>
  );
};

export default ProjectSwitcher;
