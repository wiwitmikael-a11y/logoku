// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Project } from '../types';

interface Props {
    selectedProject: Project | null;
    setSelectedProject: (project: Project | null) => void;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const AICreator: React.FC<Props> = ({ selectedProject }) => {
    return (
        <div className="p-4 bg-surface rounded-lg">
            <h2 className="text-xl font-bold text-text-header">AI Creator Studio</h2>
            {selectedProject ? (
                <p className="mt-2 text-text-body">Mengedit proyek: {selectedProject.project_name}</p>
            ) : (
                <p className="mt-2 text-text-body">Silakan buat proyek baru untuk memulai.</p>
            )}
        </div>
    );
};

export default AICreator;
