// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User, Profile, Project } from '../types';
import { playBGM, setMuted, stopBGM, playRandomBGM } from '../services/soundService';

export type BgmSelection = 'Mute' | 'Random' | 'Jingle' | 'Acoustic' | 'Uplifting' | 'LoFi' | 'Bamboo' | 'Ethnic' | 'Cozy';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  loading: boolean;
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
  handleLogout: () => void;
  executeLogout: () => Promise<void>;
  handleDeleteAccount: () => void;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  isMuted: boolean;
  handleToggleMute: () => void;
  bgmSelection: BgmSelection;
  handleBgmChange: (selection: BgmSelection) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [isMuted, setIsMutedState] = useState(() => localStorage.getItem('desainfun_isMuted') === 'true');
  const [bgmSelection, setBgmSelection] = useState<BgmSelection>(() => (localStorage.getItem('desainfun_bgmSelection') as BgmSelection) || 'Random');

  const handleLogout = () => setShowLogoutConfirm(true);

  const executeLogout = async () => {
    stopBGM();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setProjects([]);
    setShowLogoutConfirm(false);
  };

  const handleDeleteAccount = async () => {
      if (!user) return;
      alert("This is a permanent action! We are calling the RPC function to delete your data.");
      const { error } = await supabase.rpc('delete_user_account');
      if (error) {
          alert(`Error deleting account: ${error.message}`);
      } else {
          alert("Your account and all associated data have been deleted.");
          await executeLogout();
      }
  };

  const handleToggleMute = useCallback(() => {
    setIsMutedState(prev => {
        const newMuted = !prev;
        localStorage.setItem('desainfun_isMuted', String(newMuted));
        setMuted(newMuted);
        if (newMuted) {
            stopBGM();
        } else {
            if (bgmSelection === 'Mute') {
                const newSelection = 'Random';
                setBgmSelection(newSelection);
                localStorage.setItem('desainfun_bgmSelection', newSelection);
                playRandomBGM();
            } else if (bgmSelection === 'Random') {
                playRandomBGM();
            } else {
                playBGM(bgmSelection as any);
            }
        }
        return newMuted;
    });
  }, [bgmSelection]);

  const handleBgmChange = useCallback((selection: BgmSelection) => {
    setBgmSelection(selection);
    localStorage.setItem('desainfun_bgmSelection', selection);
    if (isMuted && selection !== 'Mute') {
        setIsMutedState(false);
        localStorage.setItem('desainfun_isMuted', 'false');
        setMuted(false);
    }

    if (selection === 'Mute') {
        stopBGM();
        setIsMutedState(true);
        localStorage.setItem('desainfun_isMuted', 'true');
        setMuted(true);
    } else if (selection === 'Random') {
        playRandomBGM();
    } else {
        playBGM(selection as any);
    }
  }, [isMuted]);
  
  const fetchInitialUserData = useCallback(async (userToFetch: User | null) => {
    if (!userToFetch) {
        setProfile(null);
        setProjects([]);
        return;
    }

    try {
        const [profileResponse, projectsResponse] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userToFetch.id).single(),
            supabase.from('projects').select('*').eq('user_id', userToFetch.id).order('created_at', { ascending: false })
        ]);

        const { data: profileData, error: profileError, status } = profileResponse;

        if (profileError && status !== 406) throw profileError;

        if (profileData) {
            const authName = userToFetch.user_metadata.full_name || 'Juragan Baru';
            const authAvatar = userToFetch.user_metadata.avatar_url || null;
            const needsUpdate = profileData.full_name !== authName || profileData.avatar_url !== authAvatar;

            if (needsUpdate) {
                const updates = { full_name: authName, avatar_url: authAvatar };
                const syncedProfile = { ...profileData, ...updates };
                setProfile(syncedProfile);
                
                const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userToFetch.id);
                if (updateError) console.error("Failed to sync profile to DB:", updateError);
            } else {
                setProfile(profileData);
            }
        } else if (status === 406) {
            const { data: newProfileData, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userToFetch.id,
                full_name: userToFetch.user_metadata.full_name || 'Juragan Baru',
                avatar_url: userToFetch.user_metadata.avatar_url || '',
                credits: 20, welcome_bonus_claimed: true, xp: 0, level: 1, achievements: [],
                total_projects_completed: 0, completed_first_steps: [], aipet_state: null,
                daily_actions: { claimed_missions: [] },
              })
              .select()
              .single();
            if (insertError) throw insertError;
            setProfile(newProfileData);
        }

        const { data: projectsData, error: projectsError } = projectsResponse;
        if (projectsError) {
            setAuthError(`Gagal mengambil data project: ${projectsError.message}`);
            setProjects([]);
        } else {
            setProjects(projectsData as Project[] || []);
        }

    } catch (error: any) {
        setAuthError(`Gagal memuat data pengguna: ${error.message}`);
        console.error("Error in fetchInitialUserData:", error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
        await fetchInitialUserData(user);
    }
  }, [user, fetchInitialUserData]);
  
  useEffect(() => {
    setMuted(isMuted);
    if (!isMuted) handleBgmChange(bgmSelection);
    else stopBGM();
  }, [isMuted, bgmSelection, handleBgmChange]);
  
  useEffect(() => {
    const initialize = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      await fetchInitialUserData(initialSession?.user ?? null);
      setLoading(false);
    };
    
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      await fetchInitialUserData(newSession?.user ?? null);
      
      if (event === 'SIGNED_OUT') {
        stopBGM();
      }
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, [fetchInitialUserData]);
  
  const value: AuthContextType = { session, user, profile, projects, setProjects, loading, authError, refreshProfile, isMuted, handleToggleMute, bgmSelection, handleBgmChange, showLogoutConfirm, setShowLogoutConfirm, handleLogout, executeLogout, handleDeleteAccount };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};