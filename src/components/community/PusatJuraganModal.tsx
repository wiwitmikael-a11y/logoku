// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../services/supabaseClient';
import type { PublicProject, LeaderboardUser } from '../../types';
import Spinner from '../common/Spinner';

interface Props {
  show: boolean;
  onClose: () => void;
}

const PusatJuraganModal: React.FC<Props> = ({ show, onClose }) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'leaderboard'>('gallery');
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<PublicProject[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const [galleryRes, leaderboardRes] = await Promise.all([
        supabase.from('projects').select('*, profiles(full_name, avatar_url)').eq('is_public', true).order('created_at', { ascending: false }).limit(20),
        supabase.from('profiles').select('id, full_name, avatar_url, level, xp').order('xp', { ascending: false }).limit(10)
      ]);

      if (galleryRes.error) throw new Error(`Galeri: ${galleryRes.error.message}`);
      if (leaderboardRes.error) throw new Error(`Papan Peringkat: ${leaderboardRes.error.message}`);
      
      setGallery(galleryRes.data as PublicProject[]);
      setLeaderboard(leaderboardRes.data as LeaderboardUser[]);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative max-w-4xl w-full h-[90vh] bg-surface rounded-2xl shadow-xl flex flex-col">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 z-10 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6 border-b border-border-main">
          <h2 className="text-3xl font-bold text-text-header" style={{ fontFamily: 'var(--font-display)' }}>Pusat Juragan</h2>
          <div className="flex gap-4 mt-3 border-b-2 border-border-main">
            <button onClick={() => setActiveTab('gallery')} className={`py-2 text-sm font-semibold ${activeTab === 'gallery' ? 'tab-active-splash' : 'text-text-muted'}`}>Galeri Brand Unggulan</button>
            <button onClick={() => setActiveTab('leaderboard')} className={`py-2 text-sm font-semibold ${activeTab === 'leaderboard' ? 'tab-active-splash' : 'text-text-muted'}`}>Papan Peringkat</button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full"><Spinner /></div>
          ) : error ? (
            <div className="text-center text-red-400">{error}</div>
          ) : (
            <>
              {activeTab === 'gallery' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gallery.map(proj => (
                    <div key={proj.id} className="bg-background rounded-lg p-3 animate-gallery-card-appear">
                      <img src={proj.project_data.selectedLogoUrl || ''} alt="Logo" className="w-full h-32 object-contain bg-white rounded-md p-2" />
                      <h4 className="font-bold mt-2">{proj.project_name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                        <img src={(proj.profiles as any).avatar_url} alt="User" className="w-5 h-5 rounded-full" />
                        <span>{(proj.profiles as any).full_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'leaderboard' && (
                <div className="space-y-3 max-w-md mx-auto">
                    {leaderboard.map((user, index) => (
                        <div key={user.id} className={`flex items-center gap-4 p-3 rounded-lg ${index < 3 ? 'bg-primary/10' : 'bg-background'}`}>
                           <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                           <img src={user.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full" />
                           <div className="flex-grow">
                             <p className="font-semibold text-text-header">{user.full_name}</p>
                             <p className="text-xs text-text-muted">Level {user.level}</p>
                           </div>
                           <p className="font-bold text-accent">{user.xp} XP</p>
                        </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PusatJuraganModal;
