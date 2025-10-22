// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import { UserProfile, Project } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  projects: Project[];
  loading: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  refreshProfile: () => Promise<void>;
  revalidateSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchUserData = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      setProjects([]);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // Ignore "exact one row" error if profile doesn't exist yet
        throw profileError;
      }
      setProfile(profileData);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        throw projectsError;
      }
      setProjects(projectsData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setProfile(null);
      setProjects([]);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user);
    }
  }, [user, fetchUserData]);

  const revalidateSession = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const getInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await fetchUserData(currentUser);
        setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // Fetch data on sign in or when token is refreshed.
        if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
            await fetchUserData(currentUser);
        }
        if (_event === 'SIGNED_OUT') {
            setProfile(null);
            setProjects([]);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const value = {
    session,
    user,
    profile,
    projects,
    loading,
    setProjects,
    refreshProfile,
    revalidateSession,
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
