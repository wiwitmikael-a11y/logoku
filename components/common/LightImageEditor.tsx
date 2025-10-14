// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
import React from 'react';

const tools = [
  { id: 'select', icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Select & Transform' },
  { id: 'hand', icon: 'M10 5a2 2 0 11-4 0 2 2 0 014 0zM12 15a2 2 0 11-4 0 2 2 0 014 0zM5 10a2 2 0 110-4 2 2 0 010 4zM15 10a2 2 0 110-4 2 2 0 010 4zM19 12a2 2 0 11-4 0 2 2 0 014 0z', label: 'Pan Tool' },
  { id: 'text', icon: 'M14.73 2.58a1 1 0 00-1.41-.09L3.58 13.04a1 1 0 00-.29.71v3.5a1 1 0 001 1h3.5a1 1 0 00.7-.29l10.5-10.45a1 1 0 00-.08-1.42zM7.5 16H5v-2.5l7.5-7.5L15 8.5 7.5 16z', label: 'Add Text' },
  { id: 'elements', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 0v10l8 4m0-14L4 7', label: 'Add Elements' },
  { id: 'upload', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', label: 'Upload Image' },
  { id: 'ai_generate', icon: 'M5 13l4 4L19 7', label: 'Generate with AI' },
];

interface LightImageEditorProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  addLayer?: (layerData: any) => void; // Made optional
}

const LightImageEditor: React.FC<LightImageEditorProps> = ({ activeTool, setActiveTool, addLayer }) => {
    
    const handleToolClick = (toolId: string) => {
        setActiveTool(toolId);
        // Placeholder functionality
    };

  return (
    <aside className="w-16 bg-surface border-r border-border-main flex-shrink-0 flex flex-col items-center py-4 space-y-2">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          title={tool.label}
          className={`p-3 rounded-lg transition-colors ${activeTool === tool.id ? 'bg-primary text-white' : 'text-text-muted hover:bg-background'}`}
          disabled // Disable tools while Sotoshop is under construction
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
          </svg>
        </button>
      ))}
    </aside>
  );
};

export default LightImageEditor;
