// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
import type { Layer } from '../Sotoshop';

interface QuickActionsToolbarProps {
  layer: Layer | null | undefined;
  transform: { zoom: number; pan: { x: number; y: number } };
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({ layer, transform, onDelete, onDuplicate, onMoveUp, onMoveDown }) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: -100, left: -100 });

  useEffect(() => {
    if (layer && toolbarRef.current) {
      const { x, y, width, height, rotation } = layer;
      const { zoom, pan } = transform;

      // Calculate the screen position of the layer's center
      const centerX = (x + width / 2) * zoom + pan.x;
      const centerY = (y + height / 2) * zoom + pan.y;

      // Estimate the bounding box after rotation
      const rad = rotation * Math.PI / 180;
      const absCos = Math.abs(Math.cos(rad));
      const absSin = Math.abs(Math.sin(rad));
      const boundWidth = (width * absCos + height * absSin) * zoom;
      const boundHeight = (width * absSin + height * absCos) * zoom;

      const screenTop = centerY - boundHeight / 2;
      
      const toolbarWidth = toolbarRef.current.offsetWidth;
      const toolbarHeight = toolbarRef.current.offsetHeight;
      
      const top = screenTop - toolbarHeight - 10; // 10px offset above the box
      const left = centerX - toolbarWidth / 2;
      
      setPosition({ top, left });
    }
  }, [layer, transform]);

  if (!layer) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="absolute bg-surface/90 backdrop-blur-sm border border-border-main rounded-lg shadow-lg flex items-center p-1 z-10"
      style={{ top: `${position.top}px`, left: `${position.left}px`, transition: 'top 0.1s, left 0.1s' }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent canvas drag from toolbar
    >
        <button title="Layer Up" onClick={onMoveUp} className="p-2 text-text-muted hover:bg-background rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg></button>
        <button title="Layer Down" onClick={onMoveDown} className="p-2 text-text-muted hover:bg-background rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
        <div className="w-px h-5 bg-border-main mx-1"></div>
        <button title="Duplicate" onClick={onDuplicate} className="p-2 text-text-muted hover:bg-background rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
        <div className="w-px h-5 bg-border-main mx-1"></div>
        <button title="Delete" onClick={onDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
    </div>
  );
};

export default QuickActionsToolbar;