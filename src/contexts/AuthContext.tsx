// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import type { UserProfile, Project } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const supabase = getSupabaseClient();

  const fetchUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setProjects([]);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    if (!profileData) {
        throw new Error(`Profil untuk user ID ${currentUser.id} tidak ditemukan. Sesi mungkin tidak sinkron.`);
    }
    setProfile(profileData);

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw projectsError;
    }
    setProjects(projectsData || []);

  }, [supabase]);

  useEffect(() => {
    // Rely solely on onAuthStateChange as the single source of truth.
    // It fires once on initial load and then on any auth state change.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await fetchUserData(currentUser);
      } catch (error) {
        console.error("Gagal memuat data pengguna, sesi mungkin rusak. Memaksa logout:", error);
        setProfile(null);
        setProjects([]);
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
        try {
            await fetchUserData(user);
        } catch (error) {
            console.error("Gagal me-refresh profil:", error);
            await supabase.auth.signOut();
        }
    }
  }, [user, fetchUserData, supabase]);

  const value = {
    session,
    user,
    profile,
    projects,
    setProjects,
    loading,
    refreshProfile,
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