// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import type { UserProfile } from '../types';
import { usePageFocusTrigger } from '../hooks/usePageFocusTrigger';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isNewUser: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchProfile = useCallback(async (userToFetch: User | null) => {
    if (!userToFetch) {
      setProfile(null);
      return;
    }
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userToFetch.id)
        .single();
      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error('Error in fetchProfile:', e);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  // Re-fetch profile when tab gets focus to sync credits/xp
  usePageFocusTrigger(refreshProfile);

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    const handleSession = async (session: Session | null) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
        // Check if this is the first time the user has logged in
        // A simple heuristic is checking if created_at is very close to last_sign_in_at
        const createdAt = new Date(currentUser.created_at || 0).getTime();
        const lastSignInAt = new Date(currentUser.last_sign_in_at || 0).getTime();
        if (Math.abs(lastSignInAt - createdAt) < 5000) { // e.g., within 5 seconds
            setIsNewUser(true);
        } else {
            setIsNewUser(false);
        }
      }
      setLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);
  
  const value: AuthContextType = {
    user,
    profile,
    loading,
    isNewUser,
    refreshProfile
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
