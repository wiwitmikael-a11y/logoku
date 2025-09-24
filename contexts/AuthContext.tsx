import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, supabaseError } from '../services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';
import OutOfCreditsModal from '../components/common/OutOfCreditsModal';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  deductCredits: (amount: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // Fetches user profile, creates one if it doesn't exist
  const getProfile = useCallback(async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw error;
      }
      
      if (data) {
        setProfile(data);
      } else {
        // Create a new profile for the new user
        const newProfile: Omit<Profile, 'last_credit_reset' | 'id'> & { id: string } = {
            id: user.id,
            credits: 10, // Initial credits
        };
        const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
        if (insertError) throw insertError;
        setProfile(createdProfile);
      }
    } catch (error) {
      console.error('Error fetching or creating profile:', error);
    }
  }, []);

  useEffect(() => {
    if (supabaseError) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        getProfile(currentUser).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await getProfile(currentUser);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [getProfile]);
  
  const deductCredits = async (amount: number): Promise<boolean> => {
    if (!profile || profile.credits < amount) {
      setShowCreditsModal(true);
      return false;
    }
    
    const newCredits = profile.credits - amount;
    const optimisticProfile = { ...profile, credits: newCredits };
    setProfile(optimisticProfile); // Optimistic update

    const { error } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', profile.id);

    if (error) {
      console.error("Error deducting credits:", error);
      setProfile(profile); // Revert on error
      return false;
    }
    
    return true;
  };

  const value = {
    session,
    user,
    profile,
    loading,
    deductCredits,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <OutOfCreditsModal show={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
