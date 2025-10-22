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
  revalidateSession: () => Promise<void>; // Exposed for proactive checks
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

    try {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        
        if (!profileData) {
            throw new Error(`Profil untuk user ID ${currentUser.id} tidak ditemukan. Sesi mungkin tidak sinkron.`);
        }
        setProfile(profileData);

        const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
    } catch (error) {
        console.error("Gagal memuat data pengguna, sesi mungkin rusak. Memaksa logout:", error);
        setProfile(null);
        setProjects([]);
        await supabase.auth.signOut();
    }
  }, [supabase]);
  
  const revalidateSession = useCallback(async () => {
      // Proactively check the session with the server.
      const { data } = await supabase.auth.getSession();
      // If the session state has changed (e.g., user logged out in another tab),
      // onAuthStateChange will be triggered by Supabase's broadcast channel,
      // which will then handle the state update. This function ensures we
      // trigger that check if the broadcast channel was missed (e.g., tab was suspended).
      if (JSON.stringify(data.session) !== JSON.stringify(session)) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          await fetchUserData(data.session?.user ?? null);
      }
  }, [supabase, session, fetchUserData]);

  useEffect(() => {
    // Initial, proactive check to get the session state as quickly as possible.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await fetchUserData(currentUser);
        setLoading(false); // Stop loading after the initial check.
    });

    // onAuthStateChange remains the primary listener for real-time auth events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        await fetchUserData(currentUser);
        if (loading) setLoading(false); // Ensure loading is false after auth change.
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount.

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