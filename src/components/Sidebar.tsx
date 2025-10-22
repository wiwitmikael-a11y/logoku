// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useProject } from '../contexts/ProjectContext';
import ThemeToggle from './common/ThemeToggle';
import Tooltip from './common/Tooltip';
import { playSound } from '../services/soundService';
import AboutModal from './common/AboutModal';
import ContactModal from './common/ContactModal';
import TermsOfServiceModal from './common/TermsOfServiceModal';
import PrivacyPolicyModal from './common/PrivacyPolicyModal';
import { getSupabaseClient } from '../services/supabaseClient';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<Props> = ({ isOpen, onToggle }) => {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useUI();
  const { projects, selectedProject, setSelectedProjectById, fetchProjects } = useProject();

  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showToS, setShowToS] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleNewProject = async () => {
      // Forcing the gate to show by deleting all projects of the user
      if (!profile || !window.confirm("Membuat proyek baru akan membawa Anda kembali ke Gerbang Kreasi. Lanjutkan?")) return;
      
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('projects').delete().eq('user_id', profile.id);
      if (error) {
          console.error("Failed to clear projects:", error);
      } else {
          fetchProjects(); // This will find 0 projects and trigger the gate
      }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!window.confirm("Yakin mau hapus proyek ini? Nggak bisa dibalikin lho.")) return;
    
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (!error) {
        fetchProjects();
        playSound('error');
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
        {/* Header */}
        <div className="p-4 flex items-center gap-4 border-b border-border-main" style={{ minHeight: '80px' }}>
          {!isOpen && <div className="w-10 h-10 flex-shrink-0"/>}
          {isOpen && (
            <h1 style={{fontFamily: 'var(--font-display)'}} className="text-3xl font-extrabold tracking-wider text-primary">
              des<span className="text-accent">ai</span>n<span className="text-text-header">.fun</span>
            </h1>
          )}
        </div>

        {/* New Project Button */}
        <div className="p-4">
          <button onClick={handleNewProject} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            {isOpen && <span>Proyek Baru</span>}
          </button>
        </div>

        {/* Project List */}
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          <span className="px-2 text-xs font-bold text-text-muted uppercase tracking-wider">Proyek Saya</span>
          {projects.map(p => (
            <div key={p.id} className="relative group">
              <a href="#" onClick={(e) => { e.preventDefault(); setSelectedProjectById(p.id); }} 
                 className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${selectedProject?.id === p.id ? 'bg-primary/20 text-primary font-bold' : 'text-text-body hover:bg-surface'}`}>
                <div className={`w-2 h-6 rounded-full ${selectedProject?.id === p.id ? 'bg-primary' : 'bg-transparent'}`}></div>
                <div className="w-6 h-6 flex-shrink-0 bg-border-light rounded-md flex items-center justify-center text-xs font-bold">
                  {p.project_data.project_name.substring(0, 1)}
                </div>
                {isOpen && <span className="truncate flex-grow">{p.project_data.project_name}</span>}
                {isOpen && 
                  <button onClick={(e) => handleDeleteProject(e, p.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                }
              </a>
            </div>
          ))}
        </nav>
        
        {/* Footer Links & Toggle */}
        <div className="p-4 border-t border-border-main mt-auto">
          <div className="space-y-1 mb-4">
             <SidebarItem icon="💡" text="Tentang Kami" isOpen={isOpen} onClick={() => setShowAbout(true)} />
             <SidebarItem icon="📧" text="Kontak" isOpen={isOpen} onClick={() => setShowContact(true)} />
             <SidebarItem icon="⚖️" text="Ketentuan Layanan" isOpen={isOpen} onClick={() => setShowToS(true)} />
             <SidebarItem icon="🔒" text="Kebijakan Privasi" isOpen={isOpen} onClick={() => setShowPrivacy(true)} />
             <div className="sidebar-item"><ThemeToggle theme={theme} onToggle={toggleTheme} /></div>
          </div>
          <button onClick={onToggle} className="w-full flex items-center gap-3 p-2 rounded-md text-text-muted hover:bg-surface">
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
             {isOpen && <span>Ciutkan</span>}
          </button>
        </div>
      </aside>

      {/* Modals */}
      <AboutModal show={showAbout} onClose={() => setShowAbout(false)} />
      <ContactModal show={showContact} onClose={() => setShowContact(false)} />
      <TermsOfServiceModal show={showToS} onClose={() => setShowToS(false)} />
      <PrivacyPolicyModal show={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
};

const SidebarItem: React.FC<{icon: React.ReactNode, text: string, isOpen: boolean, onClick: () => void}> = ({ icon, text, isOpen, onClick }) => (
    <div className="sidebar-item">
        <Tooltip text={text} position="right">
            <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-md text-text-muted hover:bg-surface hover:text-text-header">
                <span className="w-6 text-center">{icon}</span>
                {isOpen && <span className="text-sm">{text}</span>}
            </button>
        </Tooltip>
    </div>
);

export default Sidebar;
