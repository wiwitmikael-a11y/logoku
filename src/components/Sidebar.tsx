// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import Button from './common/Button';
import Spinner from './common/Spinner';

const Sidebar: React.FC = () => {
    const { projects, selectedProject, setSelectedProjectById, loading } = useProject();

    return (
        <aside className="w-64 bg-surface border-r border-border-main p-4 flex-col hidden md:flex">
            <h2 className="text-lg font-bold text-text-header mb-4">Proyek Saya</h2>
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <Spinner />
                </div>
            ) : (
                <div className="flex-grow space-y-2 overflow-y-auto">
                    {projects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => setSelectedProjectById(project.id)}
                            className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors ${
                                selectedProject?.id === project.id
                                    ? 'bg-primary text-white'
                                    : 'text-text-body hover:bg-background'
                            }`}
                        >
                            {project.project_data.project_name || 'Proyek Tanpa Nama'}
                        </button>
                    ))}
                </div>
            )}
            <div className="mt-4">
                <Button className="w-full" variant="secondary">
                    + Proyek Baru
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar;
