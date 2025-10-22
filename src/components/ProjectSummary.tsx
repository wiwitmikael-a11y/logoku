// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { Project, ProjectData } from '../types';
import { getSupabaseClient } from '../services/supabaseClient';
import Button from './common/Button';
import BrandGuidelineDocument from './common/BrandGuidelineDocument';

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const ProjectSummary: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [isPublic, setIsPublic] = useState(project.is_public);
  const [isUpdating, setIsUpdating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const { project_data } = project;
  const { selectedPersona, selectedLogoUrl, project_name } = project_data;

  const handleTogglePublic = async () => {
    setIsUpdating(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('projects').update({ is_public: !isPublic }).eq('id', project.id);
    if (!error) {
      setIsPublic(!isPublic);
      // We don't need to call onUpdateProject as this is not in project_data
    }
    setIsUpdating(false);
  };
  
  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    documentTitle: `Brand Guideline - ${project_name}`,
  });

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg flex items-center justify-between gap-4 mang-ai-callout border border-border-main">
        <div>
          <h2 className="text-3xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>{project_name}</h2>
          <p className="text-sm text-text-muted">Ringkasan Proyek Branding</p>
        </div>
        <div className="flex items-center gap-4">
             <Button onClick={handlePrint} variant="secondary" disabled={!selectedPersona}>
                📄 Unduh Guideline
            </Button>
            <div className="flex items-center gap-2">
                <label htmlFor="is-public-toggle" className="text-sm font-medium text-text-muted">Publik:</label>
                <input
                    type="checkbox"
                    id="is-public-toggle"
                    className="toggle-switch"
                    checked={isPublic}
                    onChange={handleTogglePublic}
                    disabled={isUpdating}
                />
            </div>
        </div>
      </div>
      
      {!selectedPersona ? (
         <div className="text-center p-8 bg-background rounded-lg min-h-[400px] flex flex-col justify-center items-center">
             <span className="text-5xl mb-4">🚀</span>
             <h2 className="text-2xl font-bold text-text-header mt-4">Proyek Ini Masih Kosong</h2>
             <p className="mt-2 text-text-muted max-w-md">Mulai petualangan branding-mu dengan pergi ke tab "1. Persona" untuk menentukan kepribadian brand-mu!</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <div className="p-4 bg-background rounded-lg">
                    <h4 className="font-bold text-primary mb-2">Logo Utama</h4>
                    {selectedLogoUrl ? (
                         <img src={selectedLogoUrl} alt="Logo" className="w-full aspect-square object-contain bg-white rounded-md p-4"/>
                    ) : (
                        <p className="text-sm text-text-muted">Belum ada logo. Selesaikan Langkah 2.</p>
                    )}
                </div>
                 <div className="p-4 bg-background rounded-lg">
                    <h4 className="font-bold text-primary mb-2">Palet Warna</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedPersona.palet_warna.map(c => (
                            <div key={c.hex} className="text-center">
                                <div className="w-10 h-10 rounded-full border border-surface" style={{backgroundColor: c.hex}} title={c.nama}/>
                                <p className="text-xs mt-1">{c.hex}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="md:col-span-2 p-4 bg-background rounded-lg space-y-4">
                <h4 className="font-bold text-primary">Persona: {selectedPersona.nama_persona}</h4>
                <p className="text-sm text-text-body italic">"{selectedPersona.deskripsi}"</p>
                <h4 className="font-bold text-primary mt-4">Gaya Bicara</h4>
                <p className="text-sm text-text-body p-3 bg-surface rounded-md">"{selectedPersona.gaya_bicara}"</p>
                 <h4 className="font-bold text-primary mt-4">Gaya Visual</h4>
                 <p className="text-sm text-text-body">{selectedPersona.visual_style}</p>
            </div>
        </div>
      )}

      {/* Hidden component for printing */}
      <div className="hidden">
        <div ref={pdfRef}>
            <BrandGuidelineDocument project={project} />
        </div>
      </div>
    </div>
  );
};

export default ProjectSummary;
