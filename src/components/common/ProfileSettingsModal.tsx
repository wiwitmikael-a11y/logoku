// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { getSupabaseClient } from '../../services/supabaseClient';
import { getIsMuted, setMuted, playBGM, stopBGM, playRandomBGM, playSound } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const bgmOptions = ['Jingle', 'Acoustic', 'Uplifting', 'LoFi', 'Bamboo', 'Ethnic', 'Cozy', 'Random', 'Stop'];

const ProfileSettingsModal: React.FC<Props> = ({ show, onClose }) => {
  const { profile, user } = useAuth();
  const { theme, toggleTheme } = useUI();
  const { language, setLanguage } = useTranslation();
  const [isMuted, setIsMuted] = useState(getIsMuted());

  useEffect(() => {
    setIsMuted(getIsMuted());
  }, [show]);

  if (!show || !profile) return null;

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    onClose();
  };
  
  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    setMuted(newMuteState);
    if(newMuteState) {
        stopBGM();
    } else {
        playBGM('welcome');
    }
  };
  
  const handleBgmChange = (bgm: string) => {
    playSound('select');
    if (bgm === 'Stop') {
        stopBGM();
    } else if (bgm === 'Random') {
        playRandomBGM();
    } else {
        playBGM(bgm as any);
    }
  };

  const xpForNextLevel = 100 + (profile.level * 150);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-xl p-6">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="flex items-center gap-4">
          <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full" />
          <div>
            <h3 className="text-xl font-bold text-text-header">{profile.full_name}</h3>
            <p className="text-sm text-text-muted">{profile.email}</p>
          </div>
        </div>
        <hr className="my-4 border-border-main" />
        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex justify-between items-center">
                <span className="font-semibold text-text-body">Bahasa:</span>
                <div className="flex gap-2">
                    <Button size="small" variant={language === 'id' ? 'primary' : 'secondary'} onClick={() => setLanguage('id')}>ID</Button>
                    <Button size="small" variant={language === 'en' ? 'primary' : 'secondary'} onClick={() => setLanguage('en')}>EN</Button>
                </div>
            </div>
             <div className="flex justify-between items-center">
                <span className="font-semibold text-text-body">Tema:</span>
                <Button size="small" variant="secondary" onClick={toggleTheme}>{theme === 'dark' ? 'Gelap' : 'Terang'}</Button>
            </div>
             <div className="flex justify-between items-center">
                <span className="font-semibold text-text-body">Suara & Musik:</span>
                <Button size="small" variant="secondary" onClick={handleMuteToggle}>{isMuted ? 'Nyalakan' : 'Matikan'}</Button>
            </div>
             <div>
                <span className="font-semibold text-text-body block mb-2">Pilih Musik Latar:</span>
                 <div className="flex flex-wrap gap-2">
                    {bgmOptions.map(bgm => (
                        <Button key={bgm} size="small" variant="secondary" onClick={() => handleBgmChange(bgm)} disabled={isMuted}>{bgm}</Button>
                    ))}
                 </div>
            </div>
            <div className="pt-2">
                <h4 className="font-bold text-text-header mb-2">Statistik Juragan</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background p-2 rounded-lg">
                        <p className="text-xs text-text-muted">Level</p>
                        <p className="text-lg font-bold text-accent">{profile.level}</p>
                    </div>
                     <div className="bg-background p-2 rounded-lg">
                        <p className="text-xs text-text-muted">XP</p>
                        <p className="text-lg font-bold text-accent">{profile.xp} / {xpForNextLevel}</p>
                    </div>
                     <div className="bg-background p-2 rounded-lg">
                        <p className="text-xs text-text-muted">Token</p>
                        <p className="text-lg font-bold text-primary">{profile.credits}</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="mt-6 flex justify-end">
            <Button onClick={handleLogout} variant="secondary">Keluar Akun</Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
