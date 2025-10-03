// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../types';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';
import Toast from './common/Toast';

interface Props {
    onClose: () => void;
}

const PAGE_SIZE = 12;

const SkeletonCard: React.FC = () => (
    <div className="bg-surface border border-border-main rounded-xl shadow-lg overflow-hidden h-full flex flex-col animate-pulse">
        <div className="bg-background h-40"></div>
        <div className="p-4 flex flex-col flex-grow">
            <div className="h-6 w-3/4 bg-background rounded-md"></div>
            <div className="h-4 w-1/2 bg-background rounded-md mt-2"></div>
            <div className="h-4 w-full bg-background rounded-md mt-4"></div>
            <div className="flex items-center gap-2 mt-4">
                <div className="w-6 h-6 rounded-full bg-background"></div>
                <div className="w-6 h-6 rounded-full bg-background"></div>
                <div className="w-6 h-6 rounded-full bg-background"></div>
            </div>
            <div className="flex justify-between items-center mt-auto pt-3 border-t border-border-main">
                 <div className="h-3 w-1/3 bg-background rounded-md"></div>
                 <div className="h-8 w-12 bg-background rounded-md"></div>
            </div>
        </div>
    </div>
);


const BrandGallery: React.FC<Props> = ({ onClose }) => {
    const { user, addXp } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [likedProjects, setLikedProjects] = useState<Set<number>>(new Set());
    const [toast, setToast] = useState({ message: '', show: false });

    const showToast = (message: string) => setToast({ message, show: true });

    const fetchProjects = useCallback(async (pageNum: number) => {
        if (pageNum === 0) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        try {
            // Fetch projects with their like count and owner ID
            const { data, error: projectError } = await supabase
                .from('projects')
                .select('id, project_data, created_at, user_id, like_count')
                .eq('status', 'completed')
                .order('like_count', { ascending: false })
                .range(from, to);

            if (projectError) throw projectError;
            
            setProjects(prev => pageNum === 0 ? data : [...prev, ...data]);
            setHasMore(data.length === PAGE_SIZE);

            // If it's the first page load and the user is logged in, fetch their likes
            if (pageNum === 0 && user) {
                const { data: likesData, error: likesError } = await supabase
                    .from('project_likes')
                    .select('project_id')
                    .eq('user_id', user.id);
                
                if (likesError) throw likesError;
                
                setLikedProjects(new Set(likesData.map(l => l.project_id)));
            }

        } catch (err: any) {
            const msg = `Gagal memuat pameran: ${err.message || 'Terjadi kesalahan tidak diketahui.'}`;
            setError(msg);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProjects(0);
    }, [fetchProjects]);
    
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProjects(nextPage);
    };

    const handleLikeToggle = async (projectId: number, ownerId: string) => {
        if (!user) {
            showToast("Login dulu buat ngasih 'Menyala!', Juragan!");
            return;
        }
        if (user.id === ownerId) {
            showToast("Gabisa ngasih 'Menyala!' ke karya sendiri, hehe.");
            return;
        }

        const isCurrentlyLiked = likedProjects.has(projectId);
        const originalProjects = [...projects];
        const originalLikedProjects = new Set(likedProjects);

        // Optimistic UI Update
        const newLikeCount = (projects.find(p => p.id === projectId)?.like_count || 0) + (isCurrentlyLiked ? -1 : 1);
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, like_count: newLikeCount } : p));
        
        const newLikedSet = new Set(likedProjects);
        if (isCurrentlyLiked) newLikedSet.delete(projectId);
        else newLikedSet.add(projectId);
        setLikedProjects(newLikedSet);
        
        try {
            if (isCurrentlyLiked) {
                // Unlike
                const { error: deleteError } = await supabase.from('project_likes').delete().match({ project_id: projectId, user_id: user.id });
                if (deleteError) throw deleteError;
                // Decrementing count is best done via RPC/trigger, but for now we call it directly for simplicity
                await supabase.rpc('decrement_like_count', { project_id_in: projectId });
            } else {
                // Like
                const { error: insertError } = await supabase.from('project_likes').insert({ project_id: projectId, user_id: user.id });
                if (insertError) throw insertError;
                await supabase.rpc('increment_like_count', { project_id_in: projectId });
                // This +1 XP is for the current user who performed the action of liking.
                // The +1 XP for the project owner must be handled on the backend via a trigger for security.
                await addXp(1);
            }
        } catch (err: any) {
            const msg = `Gagal update 'Menyala!': ${err.message || 'Gagal update.'}`;
            setError(msg);
            // Revert optimistic update on error
            setProjects(originalProjects);
            setLikedProjects(originalLikedProjects);
        }
    };
    
    return (
        <div className="flex flex-col gap-8 items-center text-center">
            <div>
                <p className="text-text-body max-w-3xl mx-auto">
                    Lihat hasil karya para juragan dari seluruh Indonesia! Kasih 'Menyala!' 🔥 untuk mengapresiasi karya mereka dan dapatkan +1 XP.
                </p>
                <div className="mt-4 text-xs text-text-muted max-w-2xl mx-auto bg-surface/50 p-2 rounded-md">
                    <strong>Info:</strong> Saat ini semua project yang selesai akan ditampilkan. Fitur untuk mengatur privasi project akan segera hadir!
                </div>
            </div>

            {isLoading ? (
                 <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                 </div>
            ) : error ? (
                <ErrorMessage message={error} onGoToDashboard={onClose} />
            ) : projects.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center text-text-muted">
                    <p className="text-lg font-semibold">Pameran Masih Sepi, Nih!</p>
                    <p>Belum ada brand yang dipamerin. Jadilah yang pertama menyelesaikan project dan tampil di sini!</p>
                </div>
            ) : (
                <>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects.map((project, index) => {
                             const { brandInputs, selectedSlogan, selectedLogoUrl, selectedPersona } = project.project_data;
                             if (!brandInputs?.businessName || !selectedLogoUrl || !selectedPersona) return null;
                             
                             const userHasLiked = likedProjects.has(project.id);
                             const isOwnProject = user?.id === project.user_id;
                             const primaryColor = selectedPersona.palet_warna_hex[0] || '#374151';

                             return (
                                <div 
                                    key={project.id} 
                                    className="animate-gallery-card-appear" 
                                    style={{ animationDelay: `${(index % PAGE_SIZE) * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}
                                >
                                    <div className="bg-surface border border-border-main rounded-xl shadow-lg overflow-hidden h-full flex flex-col text-left transition-transform duration-200 hover:-translate-y-1">
                                        <div className="p-4 flex justify-center items-center aspect-square" style={{ backgroundColor: primaryColor, backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 50%)' }}>
                                            <div className="bg-white p-3 rounded-lg shadow-lg">
                                                <img src={selectedLogoUrl} alt={`Logo for ${brandInputs.businessName}`} className="max-w-full max-h-36 object-contain" loading="lazy" />
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="font-bold text-text-header truncate">{brandInputs.businessName}</h3>
                                            {selectedSlogan && <p className="text-sm text-primary italic mt-1">"{selectedSlogan}"</p>}
                                            <div className="mt-3 space-y-2 text-xs flex-grow">
                                                <p className="text-text-body"><span className="font-semibold text-text-header">Persona:</span> {selectedPersona.nama_persona}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-text-header">Warna:</span>
                                                    <div className="flex gap-1.5">
                                                        {selectedPersona.palet_warna_hex.slice(0, 5).map(hex => <div key={hex} className="w-4 h-4 rounded-full border-2 border-border-light" style={{backgroundColor: hex}}></div>)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-text-muted mt-3 pt-3 border-t border-border-main">
                                                <p>{new Date(project.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <button 
                                                    onClick={() => handleLikeToggle(project.id, project.user_id)}
                                                    disabled={isOwnProject}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 ${isOwnProject ? 'cursor-not-allowed text-text-muted' : `hover:bg-accent/20 ${userHasLiked ? 'bg-accent/20' : 'bg-background/50'}`}`}
                                                    title={isOwnProject ? "Nggak bisa nge-like project sendiri" : "Kasih Menyala!"}
                                                >
                                                    <span className={`text-2xl transition-all duration-200 filter ${userHasLiked ? 'grayscale-0 drop-shadow-[0_0_4px_rgb(var(--c-accent))]' : 'grayscale'}`}>🔥</span>
                                                    <span className="font-bold text-base text-text-header">{project.like_count || 0}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                    {hasMore && (
                        <div className="mt-8">
                            <Button onClick={handleLoadMore} isLoading={isLoadingMore} disabled={!hasMore || isLoadingMore}>
                                Muat Lebih Banyak
                            </Button>
                        </div>
                    )}
                </>
            )}
             <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
        </div>
    );
};

export default BrandGallery;