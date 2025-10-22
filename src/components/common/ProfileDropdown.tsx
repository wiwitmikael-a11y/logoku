// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient } from '../../services/supabaseClient';
import { useUI } from '../../contexts/UIContext';
import { playSound } from '../../services/soundService';
import ProfileSettingsModal from './ProfileSettingsModal';
import DailyMissions from '../gamification/DailyMissions';
import PusatJuraganModal from '../community/PusatJuraganModal';

const ProfileDropdown: React.FC = () => {
    const { profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showMissions, setShowMissions] = useState(false);
    const [showPusatJuragan, setShowPusatJuragan] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { toggleAboutModal, toggleContactModal } = useUI();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
    };

    const handleMenuClick = (action: () => void) => {
        playSound('click');
        action();
        setIsOpen(false);
    };

    if (!profile) return null;

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                    <img src={profile.avatar_url} alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-surface" />
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-surface rounded-lg shadow-xl z-40 animate-content-fade-in-fast">
                        <div className="p-4 border-b border-border-main">
                            <p className="font-semibold text-text-header truncate">{profile.full_name}</p>
                            <p className="text-xs text-text-muted truncate">{profile.email}</p>
                        </div>
                        <nav className="py-2">
                            <button onClick={() => handleMenuClick(() => setShowSettings(true))} className="w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background">⚙️ Pengaturan Profil</button>
                            <button onClick={() => handleMenuClick(() => setShowMissions(true))} className="w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background">🎯 Misi Harian</button>
                            <button onClick={() => handleMenuClick(() => setShowPusatJuragan(true))} className="w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background">🏆 Pusat Juragan</button>
                            <button onClick={() => handleMenuClick(() => toggleAboutModal(true))} className="w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background">💡 Tentang Aplikasi</button>
                            <button onClick={() => handleMenuClick(() => toggleContactModal(true))} className="w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background">✉️ Hubungi Developer</button>
                        </nav>
                        <div className="p-2 border-t border-border-main">
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-background rounded-md">Keluar</button>
                        </div>
                    </div>
                )}
            </div>
            <ProfileSettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
            <DailyMissions show={showMissions} onClose={() => setShowMissions(false)} />
            <PusatJuraganModal show={showPusatJuragan} onClose={() => setShowPusatJuragan(false)} />
        </>
    );
};

export default ProfileDropdown;
