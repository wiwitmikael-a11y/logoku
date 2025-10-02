// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Project } from '../types';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';

interface Props {
    onGoToDashboard: () => void;
}

const PAGE_SIZE = 12; // Number of projects to fetch per page

const BrandGallery: React.FC<Props> = ({ onGoToDashboard }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const fetchProjects = useCallback(async (pageNum: number) => {
        if(pageNum === 0) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, project_data, created_at')
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            
            setProjects(prev => pageNum === 0 ? data : [...prev, ...data]);
            setHasMore(data.length === PAGE_SIZE);

        } catch (err) {
            const msg = err instanceof Error ? `Gagal memuat pameran: ${err.message}` : 'Terjadi kesalahan tidak diketahui.';
            setError(msg);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects(0);
    }, [fetchProjects]);
    
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProjects(nextPage);
    };
    
    return (
        <div className="flex flex-col gap-8 items-center text-center">
            <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-400 mb-2">Pameran Brand Juragan</h2>
                <p className="text-gray-400 max-w-3xl mx-auto">
                    Lihat hasil karya para juragan dari seluruh Indonesia! Ini adalah etalase kreativitas yang dibangun menggunakan `desain.fun`. Jadilah inspirasi dan terinspirasi.
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
                             // Skip rendering if essential data is missing
                             if (!brandInputs?.businessName || !selectedLogoUrl) {
                                return null;
                             }
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
                                            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                                                Dibuat pada: {new Date(project.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
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
        </div>
    );
};

export default BrandGallery;
