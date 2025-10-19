// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Project } from '../../types';

interface Props {
  project: Project | null;
}

const BrandGuidelineDocument: React.FC<Props> = ({ project }) => {
  if (!project || !project.project_data.selectedPersona) {
    return null;
  }

  const { project_name, project_data } = project;
  const { selectedPersona: persona, selectedLogoUrl, selectedSlogan } = project_data;

  return (
    <div id="brand-guideline-pdf" className="w-[800px] p-10 bg-white text-gray-800 font-sans">
      {/* Page 1: Cover */}
      <div className="h-[1100px] flex flex-col justify-center items-center border-b-2 border-gray-200">
        <h1 className="text-5xl font-bold tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
          BRAND GUIDELINE
        </h1>
        <h2 className="text-3xl mt-4">{project_name}</h2>
        {selectedLogoUrl && (
          <img src={selectedLogoUrl} alt="Logo" className="max-w-xs max-h-xs mt-12" />
        )}
      </div>

      {/* Page 2: Persona & Slogan */}
      <div className="h-[1100px] pt-12 border-b-2 border-gray-200">
        <h3 className="text-4xl font-bold tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>Brand Persona</h3>
        <h4 className="text-2xl font-semibold text-orange-600 mt-4">{persona.nama_persona}</h4>
        <p className="mt-2 text-gray-600">{persona.deskripsi}</p>
        
        <h4 className="text-xl font-semibold mt-8">Gaya Bicara</h4>
        <p className="mt-2 text-gray-600 italic">"{persona.gaya_bicara}"</p>
        
        {selectedSlogan && (
             <div className="mt-12 text-center bg-gray-100 p-6 rounded-lg">
                <h4 className="text-xl font-semibold">Slogan</h4>
                <p className="mt-2 text-2xl text-orange-600 font-light">"{selectedSlogan}"</p>
             </div>
        )}
      </div>

      {/* Page 3: Logo & Colors */}
      <div className="h-[1100px] pt-12">
        <h3 className="text-4xl font-bold tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>Logo & Warna</h3>
        <div className="mt-8 flex items-start gap-12">
            <div className="w-1/2">
                <h4 className="text-xl font-semibold mb-4">Logo Utama</h4>
                {selectedLogoUrl ? (
                    <div className="p-4 border border-gray-200 rounded-lg inline-block">
                        <img src={selectedLogoUrl} alt="Logo Utama" className="w-48 h-48 object-contain" />
                    </div>
                ) : <p>Logo belum dipilih.</p>}
            </div>
            <div className="w-1/2">
                <h4 className="text-xl font-semibold mb-4">Palet Warna</h4>
                 <div className="grid grid-cols-2 gap-4">
                    {persona.palet_warna.map(color => (
                        <div key={color.hex}>
                            <div className="w-full h-16 rounded" style={{ backgroundColor: color.hex }}></div>
                            <p className="text-sm font-semibold mt-1">{color.nama}</p>
                            <p className="text-xs text-gray-500">{color.hex}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-auto">
        Dihasilkan oleh desain.fun
      </div>
    </div>
  );
};

export default BrandGuidelineDocument;
