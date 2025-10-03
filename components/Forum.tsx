// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { ForumThread, ForumPost } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';
import Input from './common/Input';
import Textarea from './common/Textarea';

const THREADS_PAGE_SIZE = 20;
const POSTS_PAGE_SIZE = 50;
const POST_COOLDOWN_SECONDS = 30; // Cooldown in seconds

type ForumView = 'list' | 'thread' | 'new_thread';

// --- Helper Functions ---
const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 5) return 'baru saja';
    if (seconds < 60) return `${seconds} detik lalu`;
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days === 1) return 'kemarin';
    if (days < 7) return `${days} hari lalu`;
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};


const MANG_AI_ACCOUNT_NAME = "Mang AI";
const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const MANG_AI_AVATAR = `${GITHUB_ASSETS_URL}Mang_AI.png`;

const WARUNG_INFO_TIPS = [
    { icon: '💡', title: 'Aturan Main di WarKop', text: 'Biar nongkrongnya asik, kita jaga bareng-bareng ya. Dilarang SARA, no spam, saling support, dan jangan jualan di lapak orang lain. Oke, Juragan?' },
    { icon: '⭐', title: 'Nambah XP Sambil Ngobrol', text: 'Setiap lo bikin topik baru atau ngasih balasan yang berbobot, Mang AI bakal kasih bonus <span class="font-bold text-yellow-300">XP</span> buat naikin level kejuraganan lo!' },
    { icon: '🔥', title: 'Jangan Lupa Mampir Pameran!', text: 'Udah liat <strong class="text-white">Pameran Brand</strong> belum? Kasih \'Menyala!\' ke karya juragan lain buat nambah XP dan saling semangatin. Karyamu juga bisa dipamerin di sana lho!' },
    { icon: '💾', title: 'PENTING: Amankan Aset Lo!', text: 'Mang AI mau ngingetin lagi, semua aset visual (logo, gambar, dll) itu disimpen sementara di browser. <strong class="text-white">Jangan lupa diunduh</strong> biar nggak ilang ya!' },
    { icon: '🤖', title: 'Mang AI Siap Dengerin', text: 'Kalau ada ide, kritik, atau nemu yang aneh-aneh di aplikasi, langsung aja bikin topik baru. Masukan dari lo berharga banget buat Mang AI.' },
];

const MANG_AI_WELCOME_THREAD: ForumThread = {
  id: '0',
  created_at: new Date('2024-09-12T10:00:00Z').toISOString(),
  user_id: 'mang-ai-official',
  title: 'Selamat Datang di WarKop Juragan! ☕ Sokin, Ngopi Sambil Ngobrol!',
  content: `Wih, mantap! Selamat datang di WarKop Juragan, tempat nongkrongnya para pejuang UMKM kreatif se-Indonesia!\n\nAnggap aja ini warung kopi langganan kita. Tempat buat:\n- Pamerin hasil racikan brand dari desain.fun\n- Nanya-nanya soal resep branding & marketing\n- Saling kasih masukan biar bisnis makin ngebul\n- Ngobrol santai ngalor-ngidul bareng sesama juragan\n\nJangan malu-malu, ya! Pesan kopi (bikin topik baru), kenalan dulu, atau nimbrung di obrolan yang udah ada. Mang AI udah siapin kopinya, nih!`,
  profiles: {
    full_name: MANG_AI_ACCOUNT_NAME,
    avatar_url: MANG_AI_AVATAR,
  },
  posts: [],
  reply_count: 0,
};

const WarKopInfoBox: React.FC = () => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex(prevIndex => (prevIndex + 1) % WARUNG_INFO_TIPS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);
    const currentTip = WARUNG_INFO_TIPS[currentTipIndex];
    return (
        <div key={currentTipIndex} className="w-full bg-gray-800/50 border border-indigo-700/50 rounded-lg p-4 flex items-start gap-4 text-left animate-content-fade-in info-box-stream mb-8">
            <div className="flex-shrink-0 text-2xl pt-1">{currentTip.icon}</div>
            <div>
                <h4 className="font-bold text-white">{currentTip.title}</h4>
                <p className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: currentTip.text }} />
            </div>
        </div>
    );
};

const ThreadListSkeleton: React.FC = () => (
    <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                <div className="flex-grow">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 mt-2"></div>
                </div>
                <div className="w-16 h-8 bg-gray-700 rounded-md"></div>
                <div className="w-24 h-8 bg-gray-700 rounded-md hidden sm:block"></div>
            </div>
        ))}
    </div>
);


const getOfficialDisplayData = (profile: { full_name?: string | null, avatar_url?: string | null } | null) => {
    const isOfficial = profile?.full_name === MANG_AI_ACCOUNT_NAME;
    return {
        isOfficial,
        name: isOfficial ? "Mang AI (Official)" : profile?.full_name || "Juragan Anonim",
        avatar: isOfficial ? MANG_AI_AVATAR : profile?.avatar_url || 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/default_avatar.png',
    };
};

// --- Main Forum Component ---
const Forum: React.FC = () => {
    const { user, profile } = useAuth();
    const [view, setView] = useState<ForumView>('list');
    const [threads, setThreads] = useState<ForumThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    
    const [isLoadingThreads, setIsLoadingThreads] = useState(true);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Pagination State
    const [threadsPage, setThreadsPage] = useState(0);
    const [isLoadingMoreThreads, setIsLoadingMoreThreads] = useState(false);
    const [hasMoreThreads, setHasMoreThreads] = useState(true);


    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const fetchThreads = useCallback(async (pageNum: number) => {
        if (pageNum === 0) setIsLoadingThreads(true);
        else setIsLoadingMoreThreads(true);
        setError(null);

        const from = pageNum * THREADS_PAGE_SIZE;
        const to = from + THREADS_PAGE_SIZE - 1;

        try {
            const { data, error: threadsError } = await supabase
                .from('threads')
                .select(`id, title, created_at, content, user_id, profiles (full_name, avatar_url), posts ( count )`)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (threadsError) throw threadsError;
            
            const processedThreads = data.map((t: any) => ({
                ...t,
                posts: [],
                // FIX: Add optional chaining on `t.posts` itself.
                // Supabase returns the count as `posts: [{ count: N }]`.
                // If the relationship fails for some reason, `t.posts` could be null,
                // causing a crash on `t.posts[0]`. This change makes it safer.
                reply_count: t.posts?.[0]?.count ?? 0,
            }));
            
            if (pageNum === 0) {
                setThreads([MANG_AI_WELCOME_THREAD, ...processedThreads]);
            } else {
                setThreads(prev => [...prev, ...processedThreads]);
            }

            if (data.length < THREADS_PAGE_SIZE) {
                setHasMoreThreads(false);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memuat topik forum.');
            if (pageNum === 0) setThreads([MANG_AI_WELCOME_THREAD]);
        } finally {
            setIsLoadingThreads(false);
            setIsLoadingMoreThreads(false);
        }
    }, []);

    useEffect(() => {
        fetchThreads(0);
    }, [fetchThreads]);
    
    const handleLoadMore = () => {
        const nextPage = threadsPage + 1;
        setThreadsPage(nextPage);
        fetchThreads(nextPage);
    };

    const handleSelectThread = useCallback((thread: ForumThread) => {
        setSelectedThread(thread);
        setView('thread');
        setPosts([]);
        if (thread.id !== '0') {
            fetchPosts(thread.id);
        }
    }, []);

    const fetchPosts = async (threadId: string) => {
        setIsLoadingPosts(true);
        setError(null);
        try {
            const { data, error: postsError } = await supabase
                .from('posts')
                .select('*, profiles(full_name, avatar_url)')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true })
                .limit(POSTS_PAGE_SIZE);

            if (postsError) throw postsError;
            setPosts(data as ForumPost[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memuat balasan.');
        } finally {
            setIsLoadingPosts(false);
        }
    };
    
    const handleSubmissionError = (err: any) => {
         const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim.';
         if (errorMsg.toLowerCase().includes('security policy')) {
             setError('Waduh, Juragan, jangan ngebut-ngebut! Kasih jeda sebentar sebelum posting lagi ya.');
             setCooldown(10);
         } else {
             setError(errorMsg);
         }
    };

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newThreadTitle.trim() || !newThreadContent.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const { error: insertError } = await supabase.from('threads').insert({ user_id: user.id, title: newThreadTitle, content: newThreadContent });
            if (insertError) throw insertError;
            
            setNewThreadTitle('');
            setNewThreadContent('');
            // Reset and refetch threads from page 0
            setThreadsPage(0);
            setHasMoreThreads(true);
            await fetchThreads(0);
            setView('list');
            setCooldown(POST_COOLDOWN_SECONDS);
        } catch (err) {
            handleSubmissionError(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedThread || !newPostContent.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const { error: insertError } = await supabase.from('posts').insert({ user_id: user.id, thread_id: selectedThread.id, content: newPostContent });
            if (insertError) throw insertError;
            
            setNewPostContent('');
            await fetchPosts(selectedThread.id);
            setCooldown(POST_COOLDOWN_SECONDS);
        } catch (err) {
            handleSubmissionError(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (view === 'new_thread') {
        return (
            <div className="animate-content-fade-in">
                <Button variant="secondary" size="small" onClick={() => setView('list')} className="mb-4">&larr; Batal & Kembali</Button>
                <Card title="Buat Topik Baru di WarKop">
                    <form onSubmit={handleCreateThread} className="flex flex-col gap-4">
                        <Input label="Judul Topik" name="title" value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} required placeholder="cth: Tanya dong, bagusnya nama brand buat seblak apa ya?" />
                        <Textarea label="Isi Topik" name="content" value={newThreadContent} onChange={e => setNewThreadContent(e.target.value)} rows={8} required placeholder="Jelasin lebih detail di sini, Juragan..." />
                        <div className="flex items-center gap-4">
                            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || cooldown > 0}>Kirim Topik</Button>
                            {cooldown > 0 && <p className="text-sm text-yellow-400 animate-pulse">Tunggu {cooldown}d...</p>}
                        </div>
                         {error && <ErrorMessage message={error} />}
                    </form>
                </Card>
            </div>
        );
    }
    
    if (view === 'thread' && selectedThread) {
        const opAuthor = getOfficialDisplayData(selectedThread.profiles);
        return (
            <div className="animate-content-fade-in">
                <nav className="text-sm text-gray-400 mb-4">
                    <button onClick={() => setView('list')} className="hover:underline">WarKop Juragan</button>
                    <span className="mx-2">&rsaquo;</span>
                    <span className="text-white truncate">{selectedThread.title}</span>
                </nav>

                <div className="bg-gray-800/50 rounded-lg p-4 md:p-6 flex flex-col min-h-[60vh]">
                    <div className="pb-4 mb-4 border-b border-gray-700">
                        <h1 className="text-xl md:text-2xl font-bold text-indigo-400 mb-3">{selectedThread.title}</h1>
                        <div className={`flex items-start gap-4 ${opAuthor.isOfficial ? 'bg-amber-900/20 p-4 rounded-lg' : ''}`}>
                             <img src={opAuthor.avatar} alt={opAuthor.name} className={`w-10 h-10 rounded-full flex-shrink-0 ${opAuthor.isOfficial ? 'p-1 bg-amber-200' : 'bg-gray-700'}`} style={opAuthor.isOfficial ? { imageRendering: 'pixelated' } : {}}/>
                            <div className="flex-1">
                                <p className={`font-semibold ${opAuthor.isOfficial ? 'text-amber-300' : 'text-white'}`}>{opAuthor.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{new Date(selectedThread.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                <p className="text-gray-300 whitespace-pre-wrap selectable-text">{selectedThread.content}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                        {isLoadingPosts ? <LoadingMessage /> : error ? <ErrorMessage message={error} /> : posts.map(post => {
                            const postAuthor = getOfficialDisplayData(post.profiles);
                            return (
                                <div key={post.id} className="flex items-start gap-4">
                                     <img src={postAuthor.avatar} alt={postAuthor.name} className={`w-10 h-10 rounded-full flex-shrink-0 ${postAuthor.isOfficial ? 'p-1 bg-amber-200' : 'bg-gray-700'}`} style={postAuthor.isOfficial ? { imageRendering: 'pixelated' } : {}}/>
                                    <div className={`flex-1 p-3 rounded-lg ${postAuthor.isOfficial ? 'bg-amber-900/30' : 'bg-gray-900/50'}`}>
                                        <div className="flex items-center gap-2">
                                            <p className={`font-semibold text-sm ${postAuthor.isOfficial ? 'text-amber-300' : 'text-white'}`}>{postAuthor.name}</p>
                                            <p className="text-xs text-gray-500">{formatRelativeTime(post.created_at)}</p>
                                        </div>
                                        <p className="text-gray-300 whitespace-pre-wrap mt-1 text-sm selectable-text">{post.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {selectedThread.id !== '0' && (
                         <div className="mt-6 pt-6 border-t border-gray-700 flex-shrink-0">
                             <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                                <Textarea label={`Balas sebagai ${profile?.full_name || 'Anda'}`} name="reply" value={newPostContent} onChange={e => setNewPostContent(e.target.value)} rows={3} required/>
                                <div className="self-end flex items-center gap-4">
                                    {cooldown > 0 && <p className="text-sm text-yellow-400 animate-pulse">Tunggu {cooldown}d...</p>}
                                    <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || cooldown > 0}>Kirim Balasan</Button>
                                </div>
                                 {error && !isLoadingPosts && <ErrorMessage message={error} />}
                            </form>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto animate-content-fade-in">
            <WarKopInfoBox />
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Obrolan WarKop</h1>
                <Button onClick={() => setView('new_thread')}>+ Topik Baru</Button>
            </div>
            {error && <ErrorMessage message={error} onGoToDashboard={fetchThreads} />}
            <div className="bg-gray-800/50 rounded-lg">
                {isLoadingThreads ? <ThreadListSkeleton /> : threads.map(thread => {
                    const author = getOfficialDisplayData(thread.profiles);
                    const isPinned = thread.id === '0';
                    return (
                        <div
                            key={thread.id}
                            onClick={() => handleSelectThread(thread)}
                            className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 border-b border-gray-700 last:border-b-0 cursor-pointer transition-colors ${isPinned ? 'bg-indigo-900/30' : 'hover:bg-gray-700/50'}`}
                        >
                            {isPinned && <span title="Topik Penting">📌</span>}
                             <img src={author.avatar} alt={author.name} className={`w-10 h-10 rounded-full flex-shrink-0 ${author.isOfficial ? 'p-1 bg-amber-200' : 'bg-gray-700'}`} style={author.isOfficial ? { imageRendering: 'pixelated' } : {}}/>
                            <div className="flex-grow overflow-hidden">
                                <h3 className="font-semibold text-white truncate">{thread.title}</h3>
                                <p className="text-xs text-gray-400">
                                    Oleh <span className={author.isOfficial ? 'font-bold text-amber-300' : 'text-gray-300'}>{author.name}</span> • {formatRelativeTime(thread.created_at)}
                                </p>
                            </div>
                            <div className="text-center flex-shrink-0 w-16 hidden sm:block">
                                <p className="font-bold text-lg text-white">{thread.reply_count ?? 0}</p>
                                <p className="text-xs text-gray-500">Balasan</p>
                            </div>
                             <div className="text-right flex-shrink-0 w-28 hidden md:block">
                                <p className="text-xs text-gray-400">Aktivitas Terbaru</p>
                                <p className="text-xs text-gray-400">{formatRelativeTime(thread.created_at)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 text-center">
                {hasMoreThreads && !isLoadingThreads && (
                    <Button onClick={handleLoadMore} isLoading={isLoadingMoreThreads}>
                        Muat Lebih Banyak Topik
                    </Button>
                )}
                {!hasMoreThreads && threads.length > 1 && (
                    <p className="text-sm text-gray-500">Udah mentok, Juragan. Semua obrolan udah dimuat.</p>
                )}
            </div>
        </div>
    );
};

export default Forum;