// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient } from '../../services/supabaseClient';
import ProfileSettingsModal from './ProfileSettingsModal';
import DailyMissions from '../gamification/DailyMissions';
import PusatJuraganModal from '../community/PusatJuraganModal';
import Tooltip from './Tooltip';

const ProfileDropdown: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!profile) return null;

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Tooltip text="Profil & Pengaturan" position="left">
            <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary hover:border-accent transition-colors">
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            </button>
        </Tooltip>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-surface rounded-lg shadow-xl z-50 overflow-hidden animate-content-fade-in border border-border-main">
            <div className="p-3 border-b border-border-main">
              <p className="font-semibold text-text-header truncate">{profile.full_name}</p>
              <p className="text-xs text-text-muted truncate">{profile.email}</p>
            </div>
            <ul className="py-1">
              <li><button onClick={() => { setShowSettings(true); setIsOpen(false); }} className="dropdown-item">⚙️ Pengaturan</button></li>
              <li><button onClick={() => { setShowMissions(true); setIsOpen(false); }} className="dropdown-item">🎯 Misi Harian</button></li>
              <li><button onClick={() => { setShowCommunity(true); setIsOpen(false); }} className="dropdown-item">🏆 Pusat Juragan</button></li>
              <li><button onClick={handleLogout} className="dropdown-item text-red-500">🚪 Keluar</button></li>
            </ul>
          </div>
        )}
      </div>
      <ProfileSettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
      <DailyMissions show={showMissions} onClose={() => setShowMissions(false)} />
      <PusatJuraganModal show={showCommunity} onClose={() => setShowCommunity(false)} />
    </>
  );
};

export default ProfileDropdown;
