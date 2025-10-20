// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { Project } from '../types';
import Button from './common/Button';
import GlowingArrowButton from './common/GlowingArrowButton';

const ProjectDock: React.FC<{
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  isCreating: boolean;
}> = ({ projects, selectedProject, onSelectProject, onCreateProject, isCreating }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass-effect rounded-2xl shadow-lg transition-all duration-300 ease-in-out">
      <div className="p-4 border-b border-border-main flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-text-header">Proyek Juragan</h2>
          <p className="text-xs text-text-muted">{selectedProject ? `Terpilih: ${selectedProject.project_data.project_name}` : 'Pilih atau buat proyek baru'}</p>
        </div>
        <GlowingArrowButton isOpen={isExpanded} onClick={() => setIsExpanded(!isExpanded)} />
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
                className={`w-full text-left p-3 rounded-lg text-sm font-semibold transition-colors ${selectedProject?.id === p.id ? 'bg-primary text-white shadow-md' : 'bg-background/50 hover:bg-border-light'}`}
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

export default ProjectDock;