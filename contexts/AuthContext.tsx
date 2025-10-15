// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
  executeLogout: () => Promise<void>;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  isMuted: boolean;
  handleToggleMute: () => void;
  bgmSelection: BgmSelection;
  handleBgmChange: (selection: BgmSelection) => void;
  handleDeleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [isMuted, setIsMutedState] = useState(() => localStorage.getItem('desainfun_isMuted') === 'true');
  const [bgmSelection, setBgmSelection] = useState<BgmSelection>(() => (localStorage.getItem('desainfun_bgmSelection') as BgmSelection) || 'Random');

  const executeLogout = async () => {
    stopBGM();
    await supabase.auth.signOut();
    // State will be cleared by the onAuthStateChange listener
  };

  const handleDeleteAccount = async () => {
      if (!user) return;
      if (!window.confirm("Ini adalah tindakan permanen! Semua data proyek, profil, dan progres Anda akan dihapus selamanya. Yakin mau lanjut?")) return;

      const { error } = await supabase.rpc('delete_user_account');
      if (error) {
          alert(`Error menghapus akun: ${error.message}`);
      } else {
          alert("Akun Anda dan semua data terkait telah dihapus.");
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
            const currentSelection = localStorage.getItem('desainfun_bgmSelection') as BgmSelection || 'Random';
            if (currentSelection === 'Mute') {
                const newSelection = 'Random';
                setBgmSelection(newSelection);
                localStorage.setItem('desainfun_bgmSelection', newSelection);
                playRandomBGM();
            } else if (currentSelection === 'Random') {
                playRandomBGM();
            } else {
                playBGM(currentSelection as any);
            }
        }
        return newMuted;
    });
  }, []);

  const handleBgmChange = useCallback((selection: BgmSelection) => {
    setBgmSelection(selection);
    localStorage.setItem('desainfun_bgmSelection', selection);
    
    if (selection === 'Mute') {
        if (!isMuted) {
            setIsMutedState(true);
            localStorage.setItem('desainfun_isMuted', 'true');
            setMuted(true);
            stopBGM();
        }
    } else {
        if (isMuted) {
            setIsMutedState(false);
            localStorage.setItem('desainfun_isMuted', 'false');
            setMuted(false);
        }
        if (selection === 'Random') playRandomBGM();
        else playBGM(selection as any);
    }
  }, [isMuted]);

  const refreshProfile = useCallback(async () => {
    if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) setAuthError(error.message);
        else setProfile(data);
    }
  }, [user]);

  // Effect 1: Handles Auth State (Session and User objects)
  useEffect(() => {
    setLoading(true);
    // Check for session on initial load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false); // Initial auth check is done
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Effect 2: Handles Data Fetching based on User state
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        setAuthError(null);
        try {
          // --- Fetch Profile, Create if not exists ---
          let { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') { // "Not found" error
            const { data: newProfileData, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                full_name: user.user_metadata.full_name || 'Juragan Baru',
                avatar_url: user.user_metadata.avatar_url || '',
                credits: 20,
                welcome_bonus_claimed: true,
                last_credit_reset: new Date().toISOString(),
              })
              .select()
              .single();
            if (insertError) throw insertError;
            profileData = newProfileData;
          } else if (profileError) {
            throw profileError;
          }

          setProfile(profileData);

          // --- Fetch Projects ---
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (projectsError) throw projectsError;
          setProjects(projectsData || []);

        } catch (error: any) {
          setAuthError(`Gagal memuat data pengguna: ${error.message}`);
          setProfile(null);
          setProjects([]);
        }
      };
      
      fetchUserData();
    } else {
      // User is logged out, clear all data
      setProfile(null);
      setProjects([]);
    }
  }, [user]);
  
  const value: AuthContextType = { session, user, profile, projects, setProjects, loading, executeLogout, authError, refreshProfile, isMuted, handleToggleMute, bgmSelection, handleBgmChange, handleDeleteAccount };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
