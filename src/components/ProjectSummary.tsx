// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Project } from '../types';

const ProjectSummary: React.FC<{ project: Project | null }> = ({ project }) => {
    if (!project) {
        return (
            <div className="p-4 bg-surface rounded-lg sticky top-8">
                <h3 className="font-bold text-text-header">Ringkasan Proyek</h3>
                <p className="text-sm text-text-muted mt-2">Pilih atau buat proyek baru untuk melihat ringkasannya di sini.</p>
            </div>
        );
    }
    return (
        <div className="p-4 bg-surface rounded-lg sticky top-8">
            <h3 className="font-bold text-text-header">{project.project_name}</h3>
            <div className="mt-4 space-y-2 text-sm">
                <p>Persona: {project.project_data.selectedPersona?.nama_persona || 'Belum dipilih'}</p>
                <p>Slogan: {project.project_data.selectedSlogan || 'Belum dipilih'}</p>
                <div>
                    Logo: {project.project_data.selectedLogoUrl ? <img src={project.project_data.selectedLogoUrl} alt="logo" className="w-16 h-16 mt-1 rounded" /> : 'Belum dibuat'}
                </div>
            </div>
        </div>
    );
};

export default ProjectSummary;
