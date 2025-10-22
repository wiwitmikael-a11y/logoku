// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import ProjectSwitcher from './ProjectSwitcher';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const mainWorkflow = [
  { id: 'Ringkasan', name: 'Ringkasan', icon: '📊' },
  { id: '1. Persona', name: 'Persona Brand', icon: '👤' },
  { id: '2. Logo', name: 'Desainer Logo', icon: '🎨' },
  { id: '3. Kit Sosmed', name: 'Kit Sosmed', icon: '📱' },
  { id: '4. Konten', name: 'Kalender Konten', icon: '🗓️' },
];

const sotoshopTools = [
  { id: 'Sotoshop', name: 'Playground', icon: '✨' },
  { id: 'Studio Foto', name: 'Studio Foto', icon: '📷' },
  { id: 'Desainer Maskot', name: 'Desainer Maskot', icon: '👻' },
  { id: 'Studio Video', name: 'Studio Video', icon: '🎥' },
  { id: 'AI Presenter', name: 'AI Presenter', icon: '🎙️' },
  { id: 'Asisten Vibe', name: 'Asisten Vibe', icon: '🎨' },
  { id: 'Studio Motif', name: 'Studio Motif', icon: '✨' },
  { id: 'Scene Mixer', name: 'Scene Mixer', icon: '🎬' },
  { id: 'Lemari Brand', name: 'Lemari Brand', icon: '📦' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  
  const NavItem: React.FC<{ view: any }> = ({ view }) => (
    <li>
      <button 
        onClick={() => setActiveView(view.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${activeView === view.id ? 'bg-primary/20 text-primary' : 'text-text-body hover:bg-surface'}`}
      >
        <span className="text-lg">{view.icon}</span>
        {view.name}
      </button>
    </li>
  );

  return (
    <aside className="w-64 bg-surface/50 backdrop-blur-xl border-r border-border-main flex-shrink-0 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border-main">
        <div className="flex items-center gap-2 mb-4">
          <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-8 h-8" style={{ imageRendering: 'pixelated' }}/>
          <h1 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h1>
        </div>
        <ProjectSwitcher />
      </div>
      
      <nav className="flex-1 p-4 space-y-6">
        <div>
          <h3 className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Alur Kerja Utama</h3>
          <ul className="space-y-1">
            {mainWorkflow.map(view => <NavItem key={view.id} view={view} />)}
          </ul>
        </div>
        <div>
          <h3 className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Studio Kreatif</h3>
          <ul className="space-y-1">
             {sotoshopTools.map(view => <NavItem key={view.id} view={view} />)}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;