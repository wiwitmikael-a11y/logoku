// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import type { UserProfile, Project } from '../types';
import { setMuted } from '../services/soundService';

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
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // This function is now the single source of truth for fetching data.
  const fetchUserData = useCallback(async (user: User): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient();
      
      // Promise.all ensures both profile and projects are fetched concurrently.
      const [profileResponse, projectsResponse] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      
      const { data: profileData, error: profileError } = profileResponse;
      if (profileError) {
        // This handles cases where the profile might not exist yet for a new user, which is okay.
        // But if it's another error, we throw it.
        if (profileError.code !== 'PGRST116') {
            throw new Error(`Gagal mengambil profil: ${profileError.message}`);
        }
      }
      
      const { data: projectsData, error: projectsError } = projectsResponse;
      if (projectsError) throw new Error(`Gagal mengambil proyek: ${projectsError.message}`);

      setProfile(profileData || null);
      setProjects(projectsData || []);
      setMuted(profileData?.is_muted ?? false);
      
      return true; // Indicate success
    } catch (error) {
      setAuthError((error as Error).message);
      console.error("AuthContext Error:", error);
      return false; // Indicate failure
    }
  }, []);

  // Main authentication effect hook - now more robust.
  useEffect(() => {
    const supabase = getSupabaseClient();
    setLoading(true);

    const handleAuthStateChange = async (_event: string, session: Session | null) => {
      setSession(session);
      const currentUser = session?.user;
      setUser(currentUser ?? null);
      
      if (currentUser) {
        // If there's a user, we fetch their data.
        // The loading state will only be set to false AFTER this completes.
        await fetchUserData(currentUser);
      } else {
        // No user, clear all data.
        setProfile(null);
        setProjects([]);
      }
      setLoading(false);
    };

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Also check the initial session on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!subscription) { // Ensure we don't double-handle if the listener fires immediately
           handleAuthStateChange('INITIAL_SESSION', session);
        }
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
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setProjects([]);
    setLoading(false);
  };

  const value = {
    session,
    user,
    profile,
    projects,
    loading,
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
