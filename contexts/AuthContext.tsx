import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Profile, User } from '../types';
import { playSound, toggleMuteBGM as toggleMuteBgmUtil } from '../services/soundService';

const INITIAL_CREDITS = 10;

interface AuthContextType {
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    showOutOfCreditsModal: boolean;
    setShowOutOfCreditsModal: (show: boolean) => void;
    deductCredits: (cost: number) => Promise<boolean>;
    handleLogout: () => Promise<void>;
    handleToggleMute: () => void;
    isMuted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        const fetchSessionAndProfile = async () => {
            setLoading(true);
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                
                setSession(session);
                if (session) {
                    await fetchUserData(session.user);
                }
            } catch (e) {
                console.error("Error fetching initial session:", e);
                setSession(null);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSessionAndProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                await fetchUserData(session.user);
            } else {
                setProfile(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchUserData = async (user: User) => {
        try {
            let { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') { // Profile not found
                console.warn('Profile not found for user, creating one.');
                const today = new Date().toISOString().split('T')[0];
                const newProfile: Profile = { 
                    id: user.id,
                    credits: INITIAL_CREDITS,
                    last_credit_reset: today,
                };
                const { data: insertedProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                    .select()
                    .single();

                if (insertError) throw new Error(`Failed to create profile: ${insertError.message}`);
                userProfile = insertedProfile;
            } else if (profileError) {
                throw profileError;
            }

            // Daily credit reset logic
            const today = new Date().toISOString().split('T')[0];
            if (userProfile && userProfile.last_credit_reset !== today) {
                const { data: updatedProfile, error: updateError } = await supabase
                    .from('profiles')
                    .update({ credits: INITIAL_CREDITS, last_credit_reset: today })
                    .eq('id', user.id)
                    .select()
                    .single();
                
                if (updateError) {
                    console.error("Error resetting credits:", updateError);
                } else {
                    userProfile = updatedProfile;
                }
            }
            
            setProfile(userProfile);
        } catch (error) {
            console.error("Error in user data handling:", error);
            // Optionally set an error state to show in the UI
        }
    };
    
    const deductCredits = useCallback(async (cost: number): Promise<boolean> => {
        if (!profile || profile.credits < cost) {
            playSound('error');
            setShowOutOfCreditsModal(true);
            return false;
        }

        const newCredits = profile.credits - cost;
        const { error } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', profile.id);

        if (error) {
            console.error("Error deducting credits:", error);
            playSound('error');
            // TODO: show a generic error message to the user
            return false;
        } else {
            setProfile(prev => prev ? { ...prev, credits: newCredits } : null);
            return true;
        }
    }, [profile]);
    
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);
    };

    const handleToggleMute = useCallback(() => setIsMuted(!toggleMuteBgmUtil()), []);

    const value = {
        session,
        profile,
        loading,
        showOutOfCreditsModal,
        setShowOutOfCreditsModal,
        deductCredits,
        handleLogout,
        handleToggleMute,
        isMuted
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
