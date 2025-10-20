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

  const fetchUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setProjects([]);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found
        throw profileError;
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

    } catch (error) {
      console.error('Error fetching user data:', error);
      // Re-throw the error to be caught by the calling function's catch block
      throw error;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const supabase = getSupabaseClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Use a try...finally block to guarantee setLoading(false) is called.
      try {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // This will fetch profile, projects, etc.
        await fetchUserData(currentUser);
      } catch (error) {
        console.error("Error during authentication state change:", error);
        // Clear user data on failure to prevent a broken state
        setProfile(null);
        setProjects([]);
      } finally {
        // This ensures the loading screen is hidden even if data fetching fails.
        setLoading(false);
      }
    });

    // This part is an optimization. If there's no session token at all,
    // we don't need to wait for onAuthStateChange to tell us that. We can show
    // the login screen right away. If there IS a session, onAuthStateChange
    // will handle the full data load and then set loading to false.
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            setLoading(false);
        }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const refreshProfile = useCallback(async () => {
    if (user) {
        try {
            await fetchUserData(user);
        } catch (error) {
            console.error("Failed to refresh profile:", error);
        }
    }
  }, [user, fetchUserData]);

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