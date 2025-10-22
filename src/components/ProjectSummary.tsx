// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Added full content for ProjectSummary.tsx.
import React from 'react';
import type { Project } from '../types';
import Spinner from './common/Spinner';

interface Props {
  project: Project | null;
  isLoading: boolean;
}

const ProjectSummary: React.FC<Props> = ({ project, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return <div className="p-4 text-center text-xs text-text-muted">Tidak ada proyek yang dipilih.</div>;
  }

  const { selectedLogoUrl, selectedPersona } = project.project_data;

  return (
    <div className="p-4 bg-background/50 rounded-lg space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-1 flex-shrink-0">
          {selectedLogoUrl ? (
            <img src={selectedLogoUrl} alt="Logo Proyek" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-3xl text-text-muted">?</span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-text-header truncate">{project.project_data.project_name}</h3>
          <p className="text-sm text-primary font-semibold">{selectedPersona?.nama_persona || 'Pilih Persona'}</p>
        </div>
      </div>
      {selectedPersona && (
        <div className="flex flex-wrap gap-1">
          {selectedPersona.palet_warna.map(color => (
            <div key={color.hex} className="w-6 h-6 rounded-full border-2 border-surface" style={{ backgroundColor: color.hex }} title={color.nama} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectSummary;
