// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { useAuth, BgmSelection } from '../contexts/AuthContext';
import type { AppView } from '../App';
import HeaderStats from './gamification/HeaderStats';
import ProfileSettingsModal from './common/ProfileSettingsModal';
import ConfirmationModal from './common/ConfirmationModal';
import OutOfCreditsModal from './common/OutOfCreditsModal';
// FIX: Import Button component
import Button from './common/Button';

interface HeaderProps {
    onNavigate: (view: AppView) => void;
    currentView: AppView;
    onShowAbout: () => void;
    onShowContact: () => void;
    onShowGallery: () => void;
    onShowPusatJuragan: () => void;
    // FIX: Add onShowToS to pass to ProfileSettingsModal
    onShowToS: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const MusicControl: React.FC = () => {
    const { isMuted, handleToggleMute, bgmSelection, handleBgmChange } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const bgmOptions: { id: BgmSelection, name: string, icon: string }[] = [
        { id: 'Mute', name: 'Hening', icon: '🔇' },
        { id: 'Random', name: 'Acak', icon: '🔀' },
        { id: 'Jingle', name: 'Jingle', icon: '🎵' },
        { id: 'Acoustic', name: 'Akustik', icon: '🎸' },
        { id: 'Uplifting', name: 'Semangat', icon: '✨' },
        { id: 'LoFi', name: 'Lo-Fi', icon: '🎧' },
        { id: 'Bamboo', name: 'Bambu', icon: '🎍' },
        { id: 'Ethnic', name: 'Etnik', icon: '🥁' },
        { id: 'Cozy', name: 'Santai', icon: '☕' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedBgm = bgmOptions.find(b => b.id === bgmSelection);

    return (
        <div ref={dropdownRef} className="relative">
            <button onClick={() => setIsOpen(prev => !prev)} title="Kontrol Musik" className="p-2 text-text-muted rounded-full hover:bg-background hover:text-text-header transition-colors">
                {isMuted || bgmSelection === 'Mute' ? 
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                :
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" /></svg>
                }
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-surface-content border border-border-main rounded-lg shadow-xl z-50 animate-content-fade-in py-1">
                    <button onClick={handleToggleMute} className="w-full text-left px-3 py-2 text-sm text-text-body hover:bg-background flex items-center gap-2">{isMuted ? 'Suarakan' : 'Bisukan'}</button>
                    <div className="border-t border-border-main my-1"></div>
                    {bgmOptions.map(opt => (
                        <button key={opt.id} onClick={() => handleBgmChange(opt.id)} className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${bgmSelection === opt.id && !isMuted ? 'font-bold text-splash' : 'text-text-body hover:bg-background'}`}>
                            <span>{opt.icon}</span><span>{opt.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


const UserMenu: React.FC<Omit<HeaderProps, 'onNavigate' | 'currentView'>> = ({ onShowAbout, onShowContact, onShowGallery, onShowPusatJuragan, onShowToS }) => {
    // FIX: Add handleDeleteAccount from useAuth
    const { user, profile, handleLogout, showLogoutConfirm, setShowLogoutConfirm, executeLogout, showOutOfCreditsModal, setShowOutOfCreditsModal, handleDeleteAccount } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user || !profile) return null;

    return (
        <div ref={menuRef} className="relative">
            <button onClick={() => setIsMenuOpen(prev => !prev)} className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-content transition-colors">
                <img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} className="w-9 h-9 rounded-full" />
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-text-header">{user.user_metadata.full_name.split(' ')[0]}</span>
                    <span className="text-xs text-text-muted">Level {profile.level}</span>
                </div>
            </button>

            {isMenuOpen && (
                <>
                    <div className="absolute top-full right-0 mt-2 w-72 bg-surface-content border border-border-main rounded-lg shadow-xl z-50 animate-content-fade-in p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-border-main">
                            <HeaderStats profile={profile} />
                            <div className="flex items-center gap-2 font-bold text-lg text-primary bg-background px-3 py-1.5 rounded-md" title={`${profile.credits} Token Tersisa`}>
                                <img src={`${GITHUB_ASSETS_URL}token.png`} alt="Token" className="w-5 h-5"/>
                                <span>{profile.credits}</span>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-1">
                            <a href="#" onClick={(e) => { e.preventDefault(); onShowPusatJuragan(); setIsMenuOpen(false); }} className="px-3 py-2 text-text-body hover:bg-background rounded-md flex items-center gap-3 transition-colors">🏆 Pusat Juragan</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); onShowGallery(); setIsMenuOpen(false); }} className="px-3 py-2 text-text-body hover:bg-background rounded-md flex items-center gap-3 transition-colors">🖼️ Pameran Brand</a>
                             <a href="#" onClick={(e) => { e.preventDefault(); setIsSettingsOpen(true); setIsMenuOpen(false); }} className="px-3 py-2 text-text-body hover:bg-background rounded-md flex items-center gap-3 transition-colors">⚙️ Pengaturan Profil</a>
                        </nav>
                        
                        <div className="border-t border-border-main pt-3 flex flex-col gap-1">
                            <a href="#" onClick={(e) => { e.preventDefault(); onShowAbout(); setIsMenuOpen(false); }} className="px-3 py-2 text-sm text-text-muted hover:bg-background rounded-md transition-colors">Tentang Aplikasi</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); onShowContact(); setIsMenuOpen(false); }} className="px-3 py-2 text-sm text-text-muted hover:bg-background rounded-md transition-colors">Info Dev</a>
                        </div>

                        <Button onClick={() => handleLogout()} size="small" variant="secondary" className="mt-2 w-full">Logout</Button>
                    </div>
                </>
            )}

             <Suspense fallback={null}>
                {/* FIX: Pass correct props to ProfileSettingsModal */}
                {isSettingsOpen && <ProfileSettingsModal show={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} profile={profile} onLogout={() => { setIsSettingsOpen(false); handleLogout(); }} onDeleteAccount={handleDeleteAccount} onShowToS={onShowToS} onShowContact={onShowContact} />}
                {showLogoutConfirm && <ConfirmationModal show={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={executeLogout} title="Yakin mau keluar?" confirmText="Ya, Keluar" cancelText="Gak Jadi"><p>Nanti mampir lagi ya, Juragan!</p></ConfirmationModal>}
                {showOutOfCreditsModal && <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />}
            </Suspense>
        </div>
    );
};

const Header: React.FC<HeaderProps> = (props) => {
    const { onNavigate, currentView } = props;
    const navItems: { id: AppView; name: string }[] = [
        { id: 'DASHBOARD', name: 'Dashboard' },
        { id: 'QUICK_TOOLS', name: 'Perkakas Kilat' },
        { id: 'FORUM', name: 'WarKop Juragan' },
    ];

    return (
        <header className="sticky top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-md">
            <div className="policeline-accent h-1.5 w-full"></div>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Left Section: Logo & Navigation */}
                    <div className="flex items-center gap-2 md:gap-6">
                        <a href="/" className="flex items-center gap-2" onClick={(e) => { e.preventDefault(); onNavigate('DASHBOARD'); }}>
                            <img src={`${GITHUB_ASSETS_URL}desainfun_logo_icon.png`} alt="desain.fun logo" className="w-8 h-8"/>
                            <span style={{fontFamily: 'var(--font-display)'}} className="text-2xl font-extrabold tracking-wider text-primary hidden sm:inline">desain<span className="text-text-header">.fun</span></span>
                        </a>
                        <nav className="hidden md:flex items-center gap-2">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${currentView === item.id ? 'text-splash' : 'text-text-muted hover:text-text-header'}`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Right Section: User Menu & Actions */}
                    <div className="flex items-center gap-2">
                        <MusicControl />
                        <UserMenu {...props} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;