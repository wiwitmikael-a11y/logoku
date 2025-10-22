// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SaveStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleSaveStatus = (event: Event) => {
      const { isSaving, error } = (event as CustomEvent).detail;
      if (error) {
        setStatus('error');
        setErrorMessage(error);
      } else if (isSaving) {
        setStatus('saving');
      } else {
        setStatus('saved');
      }
    };
    
    window.addEventListener('saveStatusChanged', handleSaveStatus);

    return () => {
      window.removeEventListener('saveStatusChanged', handleSaveStatus);
    };
  }, []);

  useEffect(() => {
    // FIX: Changed NodeJS.Timeout to number for browser environment.
    let timer: number;
    if (status === 'saved' || status === 'error') {
      timer = setTimeout(() => {
        setStatus('idle');
        setErrorMessage(null);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [status]);

  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return { icon: '🔄', text: 'Menyimpan...', color: 'text-blue-400' };
      case 'saved':
        return { icon: '✅', text: 'Tersimpan', color: 'text-green-400' };
      case 'error':
        return { icon: '❌', text: 'Gagal', color: 'text-red-400' };
      case 'idle':
      default:
        return { icon: '☁️', text: 'Tersimpan otomatis', color: 'text-text-muted' };
    }
  };
  
  const { icon, text, color } = getStatusContent();

  return (
    <div className={`hidden md:flex items-center gap-2 text-xs font-semibold transition-all ${color}`} title={errorMessage || text}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
};

export default SaveStatusIndicator;
