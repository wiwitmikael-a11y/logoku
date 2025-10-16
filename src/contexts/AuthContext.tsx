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
  
  const fetchProfileAndProjects = useCallback(async (user: User) => {
    try {
      const supabase = getSupabaseClient();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);
      setMuted(profileData?.is_muted ?? false);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

    } catch (error) {
      setAuthError((error as Error).message);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileAndProjects(session.user);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        await fetchProfileAndProjects(session.user);
        setLoading(false);
      } else {
        setProfile(null);
        setProjects([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfileAndProjects]);
  
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfileAndProjects(user);
    }
  }, [user, fetchProfileAndProjects]);

  const executeLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
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
