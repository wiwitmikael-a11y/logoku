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
  
  // XP Calculation Logic
  const getXpForLevel = (level: number): number => 100 + (level * 150);
  const xpForNextLevel = getXpForLevel(profile.level);
  const xpForCurrentLevel = getXpForLevel(profile.level - 1);
  const totalXpInLevel = xpForNextLevel - xpForCurrentLevel;
  const currentXpInLevel = profile.xp - xpForCurrentLevel;
  const progressPercentage = totalXpInLevel > 0 ? Math.max(0, Math.min(100, (currentXpInLevel / totalXpInLevel) * 100)) : 0;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Tooltip text="Profil & Pengaturan" position="left">
            <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary hover:border-accent transition-colors">
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            </button>
        </Tooltip>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-surface rounded-lg shadow-xl z-50 overflow-hidden animate-content-fade-in border border-border-main">
            <div className="p-3 border-b border-border-main">
              <p className="font-semibold text-text-header truncate">{profile.full_name}</p>
              <p className="text-xs text-text-muted truncate">{profile.email}</p>
            </div>
            
            {/* NEW: Stats Block */}
            <div className="p-3 border-b border-border-main space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="text-lg">✨</span>
                    <span className="text-sm">{profile.credits} Spark Tersisa</span>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <p className="font-semibold text-accent">Level {profile.level}</p>
                        <p className="text-text-muted">{profile.xp} / {xpForNextLevel} XP</p>
                    </div>
                    <Tooltip text={`${Math.round(progressPercentage)}% menuju level berikutnya`}>
                      <div className="w-full bg-border-main rounded-full h-1.5">
                          <div 
                              className="bg-accent h-1.5 rounded-full" 
                              style={{ width: `${progressPercentage}%`, background: 'linear-gradient(90deg, rgb(var(--c-accent)) 0%, rgb(var(--c-accent-hover)) 100%)' }}
                          ></div>
                      </div>
                    </Tooltip>
                </div>
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