// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { getSupabaseClient } from '../../services/supabaseClient';
import { playSound, unlockAudio, setMuted, getIsMuted } from '../../services/soundService';
import Button from './Button';
import Input from './Input';
import ErrorMessage from './ErrorMessage';
import { useTranslation } from '../../contexts/LanguageContext';

interface Props {
  show: boolean;
  onClose: () => void;
}

const ProfileSettingsModal: React.FC<Props> = ({ show, onClose }) => {
  const { user, profile, executeLogout, refreshProfile } = useAuth();
  const { } = useUI();
  const { language, setLanguage } = useTranslation();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMutedState, setIsMutedState] = useState(getIsMuted());

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
    }
    setIsMutedState(getIsMuted());
  }, [profile, show]);

  if (!show) return null;

  const handleSave = async () => {
    if (!user || !fullName.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    setIsSaving(true);
    setError(null);
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() }) // Removed is_muted from update
      .eq('id', user.id);
    
    if (updateError) {
      setError(updateError.message);
      playSound('error');
    } else {
      await refreshProfile();
      playSound('success');
      onClose();
    }
    setIsSaving(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as 'id' | 'en');
  };
  
  const handleMuteToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const shouldMute = e.target.checked;
      await unlockAudio();
      setIsMutedState(shouldMute);
      setMuted(shouldMute);
  };

  const handleLogout = async () => {
    await executeLogout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="relative max-w-md w-full bg-surface rounded-2xl shadow-xl p-8">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex items-center gap-4 mb-6">
          <img src={profile?.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full" />
          <div>
            <h2 id="profile-modal-title" className="text-xl font-bold text-text-header">{profile?.full_name}</h2>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Input 
            label="Nama Lengkap"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-text-muted mb-1">
              Bahasa
            </label>
            <select id="language-select" value={language} onChange={handleLanguageChange} className="w-full bg-background border border-border-main rounded-lg px-3 py-2 text-text-body focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
           <div className="flex items-center justify-between p-2 bg-background rounded-md">
                <label htmlFor="mute-toggle" className="text-sm font-medium text-text-body">Mute Suara UI</label>
                <input type="checkbox" id="mute-toggle" checked={isMutedState} onChange={handleMuteToggle} className="h-4 w-4 rounded bg-surface border-border-main text-primary focus:ring-primary"/>
            </div>

        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex flex-col gap-2 mt-6">
          <Button onClick={handleSave} isLoading={isSaving} className="w-full">
            Simpan Perubahan
          </Button>
          <Button onClick={handleLogout} variant="secondary" className="w-full">
            Keluar Akun
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;