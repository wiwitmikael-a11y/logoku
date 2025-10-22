// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../services/supabaseClient';
import type { LeaderboardUser, PublicProject } from '../../types';
import Spinner from '../common/Spinner';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  show: boolean;
  onClose: () => void;
}

const PusatJuraganModal: React.FC<Props> = ({ show, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'gallery'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [gallery, setGallery] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      const fetchLeaderboard = async () => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, level, xp')
          .order('level', { ascending: false })
          .order('xp', { ascending: false })
          .limit(10);
        if (!error) setLeaderboard(data as LeaderboardUser[]);
      };

      const fetchGallery = async () => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('projects')
          .select('id, project_data, profiles(full_name, avatar_url)')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(9);
        if (!error) setGallery(data as any[]); // Cast to any to avoid profile nesting issues
      };
      
      setLoading(true);
      Promise.all([fetchLeaderboard(), fetchGallery()]).finally(() => setLoading(false));
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative max-w-3xl w-full h-[80vh] bg-surface rounded-2xl shadow-xl flex flex-col">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 z-10 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="p-6 border-b border-border-main">
          <h2 className="text-3xl font-bold text-text-header" style={{ fontFamily: 'var(--font-display)' }}>🏆 Pusat Juragan</h2>
          <p className="text-sm text-text-muted">Lihat para juragan paling jago dan galeri brand publik.</p>
          <div className="flex gap-2 mt-4 border-b-2 border-border-main">
            <button onClick={() => setActiveTab('leaderboard')} className={`py-2 px-4 text-sm font-semibold ${activeTab === 'leaderboard' ? 'tab-active' : 'text-text-muted'}`}>Papan Peringkat</button>
            <button onClick={() => setActiveTab('gallery')} className={`py-2 px-4 text-sm font-semibold ${activeTab === 'gallery' ? 'tab-active' : 'text-text-muted'}`}>Galeri Brand</button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6">
          {loading ? <div className="flex justify-center items-center h-full"><Spinner /></div> : (
            <>
              {activeTab === 'leaderboard' && (
                <div className="space-y-2">
                  {leaderboard.map((u, i) => (
                    <div key={u.id} className={`flex items-center gap-4 p-3 rounded-lg ${u.id === user?.id ? 'bg-primary/20' : 'bg-background'}`}>
                      <span className="font-bold text-lg w-6 text-center">{i + 1}</span>
                      <img src={u.avatar_url} alt={u.full_name} className="w-10 h-10 rounded-full" />
                      <p className="flex-grow font-semibold text-text-header">{u.full_name}</p>
                      <div className="text-right">
                         <p className="text-accent font-bold">Level {u.level}</p>
                         <p className="text-xs text-text-muted">{u.xp} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'gallery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.map(p => (
                    <div key={p.id} className="bg-background rounded-lg p-3 group cursor-pointer">
                      {p.project_data.selectedLogoUrl ? (
                         <img src={p.project_data.selectedLogoUrl} alt="logo" className="w-full h-32 object-contain bg-white rounded-md mb-2" />
                      ) : (
                        <div className="w-full h-32 bg-border-light rounded-md mb-2 flex items-center justify-center text-text-muted">No Logo</div>
                      )}
                      <h4 className="font-bold text-sm text-text-header truncate">{p.project_data.project_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                          <img src={p.profiles.avatar_url} alt={p.profiles.full_name} className="w-5 h-5 rounded-full" />
                          <p className="text-xs text-text-muted truncate">{p.profiles.full_name}</p>
                      </div>
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
