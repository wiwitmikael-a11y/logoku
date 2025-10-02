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
    onGoToDashboard: () => void;
}

const PAGE_SIZE = 12;

const BrandGallery: React.FC<Props> = ({ onGoToDashboard }) => {
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
                .order('created_at', { ascending: false })
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

        } catch (err) {
            const msg = err instanceof Error ? `Gagal memuat pameran: ${err.message}` : 'Terjadi kesalahan tidak diketahui.';
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
        } catch (err) {
            const msg = err instanceof Error ? `Gagal update 'Menyala!': ${err.message}` : 'Gagal update.';
            setError(msg);
            // Revert optimistic update on error
            setProjects(originalProjects);
            setLikedProjects(originalLikedProjects);
        }
    };
    
    return (
        <div className="flex flex-col gap-8 items-center text-center">
            <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-400 mb-2">Pameran Brand Juragan</h2>
                <p className="text-gray-400 max-w-3xl mx-auto">
                    Lihat hasil karya para juragan dari seluruh Indonesia! Kasih 'Menyala!' 🔥 untuk mengapresiasi karya mereka dan dapatkan +1 XP.
                </p>
                <div className="mt-4 text-xs text-gray-500 max-w-2xl mx-auto bg-gray-800/50 p-2 rounded-md">
                    <strong>Info:</strong> Saat ini semua project yang selesai akan ditampilkan. Fitur untuk mengatur privasi project akan segera hadir!
                </div>
            </div>

            {isLoading ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                    <LoadingMessage />
                </div>
            ) : error ? (
                <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />
            ) : projects.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center text-gray-500">
                    <p className="text-lg font-semibold">Pameran Masih Sepi, Nih!</p>
                    <p>Belum ada brand yang dipamerin. Jadilah yang pertama menyelesaikan project dan tampil di sini!</p>
                    <Button onClick={onGoToDashboard} variant="secondary" className="mt-6">
                        &larr; Kembali ke Dashboard
                    </Button>
                </div>
            ) : (
                <>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects.map((project, index) => {
                             const { brandInputs, selectedSlogan, selectedLogoUrl } = project.project_data;
                             if (!brandInputs?.businessName || !selectedLogoUrl) return null;
                             
                             const userHasLiked = likedProjects.has(project.id);
                             const isOwnProject = user?.id === project.user_id;

                             return (
                                <div 
                                    key={project.id} 
                                    className="animate-gallery-card-appear" 
                                    style={{ animationDelay: `${(index % PAGE_SIZE) * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}
                                >
                                    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden h-full flex flex-col text-left transition-transform duration-200 hover:-translate-y-1">
                                        <div className="bg-white p-4 flex justify-center items-center aspect-square">
                                            <img src={selectedLogoUrl} alt={`Logo for ${brandInputs.businessName}`} className="max-w-full max-h-48 object-contain" loading="lazy" />
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="font-bold text-white truncate">{brandInputs.businessName}</h3>
                                            {selectedSlogan && <p className="text-sm text-indigo-300 italic mt-1 flex-grow">"{selectedSlogan}"</p>}
                                            <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                                                <p>Dibuat: {new Date(project.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <button 
                                                    onClick={() => handleLikeToggle(project.id, project.user_id)}
                                                    disabled={isOwnProject}
                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${isOwnProject ? 'cursor-not-allowed text-gray-600' : 'hover:bg-orange-500/10'}`}
                                                    title={isOwnProject ? "Nggak bisa nge-like project sendiri" : "Kasih Menyala!"}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${userHasLiked ? 'text-orange-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M11.275 2.016a.75.75 0 01.543 1.326 12.75 12.75 0 01-2.502 3.948.75.75 0 01-1.206-.822 11.25 11.25 0 002.165-3.452zM8.75 5.25a.75.75 0 01.822 1.206 12.75 12.75 0 01-3.948 2.502.75.75 0 01-1.326-.543 11.25 11.25 0 003.452-2.165zM5.25 8.75a.75.75 0 011.206.822 12.75 12.75 0 01-2.502 3.948.75.75 0 01-1.326-.543 11.25 11.25 0 002.165-3.452zM12 11.25a.75.75 0 01.75.75 3.75 3.75 0 11-7.5 0 .75.75 0 01.75-.75h6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="font-semibold text-sm text-gray-300">{project.like_count || 0}</span>
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