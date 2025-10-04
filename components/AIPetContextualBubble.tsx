// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { playSound } from '../services/soundService';

interface Props {
  message: string | null;
  onClose: () => void;
}

const AIPetContextualBubble: React.FC<Props> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      playSound('select'); // A subtle sound when the bubble appears
    }
  }, [message]);
  
  if (!message) return null;

  return (
    <div
      className="fixed bottom-36 right-8 w-64 bg-surface/90 backdrop-blur-md border border-border-main rounded-xl shadow-lg z-30 p-3 animate-content-fade-in"
      role="alert"
    >
      <style>{`
        .contextual-bubble::after {
          content: '';
          position: absolute;
          bottom: -8px;
          right: 24px;
          border-width: 8px;
          border-style: solid;
          border-color: rgb(var(--c-surface)/0.9) transparent transparent transparent;
        }
      `}</style>
      <div className="contextual-bubble relative">
        <button onClick={onClose} className="absolute -top-1 -right-1 text-text-muted hover:text-text-header text-xl leading-none">&times;</button>
        <p className="text-sm text-text-body" dangerouslySetInnerHTML={{ __html: message }} />
      </div>
    </div>
  );
};

export default AIPetContextualBubble;