// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import type { UserProfile, Project } from '../types';
import { setMuted, initializeMuteState } from '../services/soundService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  projects: Project[];
  loading: boolean;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  executeLogout: () => Promise<void>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const fetchUserData = useCallback(async (user: User): Promise<void> => {
    setUserDataLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileError && profileError.code !== 'PGRST116') throw new Error(`Gagal mengambil profil: ${profileError.message}`);
      
      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (projectsError) throw new Error(`Gagal mengambil proyek: ${projectsError.message}`);

      setProfile(profileData || null);
      setProjects(projectsData || []);
      // Mute state is now handled by soundService and localStorage, no need to fetch from profile.

    } catch (error) {
      setAuthError((error as Error).message);
      console.error("AuthContext Data Fetch Error:", error);
    } finally {
      setUserDataLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeMuteState(); // Initialize mute state from localStorage
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user;
      setUser(currentUser ?? null);

      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setProfile(null);
        setProjects([]);
      }
      
      setInitialAuthCheckComplete(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);
  
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user);
    }
  }, [user, fetchUserData]);

  const executeLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    projects,
    loading: !initialAuthCheckComplete || userDataLoading,
    authError,
    refreshProfile,
    executeLogout,
    setProjects,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};