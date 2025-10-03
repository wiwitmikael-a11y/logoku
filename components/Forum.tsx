// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { ForumThread, ForumPost } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';
import Input from './common/Input';
import Textarea from './common/Textarea';

const THREADS_PAGE_SIZE = 10;
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
    const { user, profile, addXp } = useAuth();
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

    const fetchThreads = useCallback(async (pageNum: number) => {
        if (pageNum === 0) setIsLoadingThreads(true);
        else setIsLoadingMoreThreads(true);
        setError(null);
        
        const from = pageNum * THREADS_PAGE_SIZE;
        const to = from + THREADS_PAGE_SIZE - 1;

        try {
            const { data, error: rpcError, count } = await supabase
                .rpc('get_threads_with_reply_count', {}, { count: 'exact' })
                .order('last_activity', { ascending: false })
                .range(from, to);

            if (rpcError) throw rpcError;

            // Map profiles data correctly
            const formattedData = data.map((d: any) => ({
                ...d,
                profiles: d.profiles_data
            }));
            
            setThreads(prev => pageNum === 0 ? formattedData : [...prev, ...formattedData]);
            setHasMoreThreads(formattedData.length === THREADS_PAGE_SIZE);

        } catch (err: any) {
            setError(`Gagal memuat topik: ${err.message || 'Terjadi kesalahan tidak diketahui.'}`);
        } finally {
            setIsLoadingThreads(false);
            setIsLoadingMoreThreads(false);
        }
    }, []);
    
    const handleLoadMoreThreads = () => {
        const nextPage = threadsPage + 1;
        setThreadsPage(nextPage);
        fetchThreads(nextPage);
    };

    const fetchPosts = useCallback(async (threadId: string) => {
        setIsLoadingPosts(true);
        setPosts([]);
        try {
            const { data, error: postsError } = await supabase
                .from('posts')
                .select('*, profiles(full_name, avatar_url)')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true })
                .limit(POSTS_PAGE_SIZE);

            if (postsError) throw postsError;
            setPosts(data as ForumPost[]);

        } catch(err: any) {
            setError(`Gagal memuat balasan: ${err.message || 'Terjadi kesalahan tidak diketahui.'}`);
        } finally {
            setIsLoadingPosts(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
            fetchThreads(0);
        }
        if (view === 'thread' && selectedThread && selectedThread.id !== '0') {
            fetchPosts(selectedThread.id);
        }
        if (view === 'new_thread') {
            const preload = sessionStorage.getItem('forumPreload');
            if (preload) {
                try {
                    const { title, content } = JSON.parse(preload);
                    setNewThreadTitle(title);
                    setNewThreadContent(content);
                } catch (e) { console.error("Failed to parse forum preload data"); }
                sessionStorage.removeItem('forumPreload');
            }
        }
    }, [view, selectedThread, fetchThreads, fetchPosts]);

    // Realtime listener for new posts
    useEffect(() => {
        if (view !== 'thread' || !selectedThread || selectedThread.id === '0') return;

        const channel = supabase.channel(`posts:${selectedThread.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'posts', 
                filter: `thread_id=eq.${selectedThread.id}` 
            }, async (payload) => {
                // Fetch the full post with profile data
                const { data, error } = await supabase
                    .from('posts')
                    .select('*, profiles(full_name, avatar_url)')
                    .eq('id', payload.new.id)
                    .single();
                
                if (error) {
                    console.error("Error fetching new post with profile:", error);
                } else if (data) {
                    setPosts(prev => [...prev, data as ForumPost]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [view, selectedThread]);


    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleCreateThread = async () => {
        if (!user || !profile || !newThreadTitle.trim() || !newThreadContent.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const { data, error: insertError } = await supabase
                .from('threads')
                .insert({ user_id: user.id, title: newThreadTitle, content: newThreadContent })
                .select()
                .single();
            if (insertError) throw insertError;
            
            await addXp(20); // +20 XP for new thread
            setCooldown(POST_COOLDOWN_SECONDS);
            setNewThreadTitle('');
            setNewThreadContent('');
            setView('list'); // Go back to list, which will trigger a refetch

        } catch (err: any) {
            setError(`Gagal bikin topik: ${err.message || 'Terjadi kesalahan.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCreatePost = async () => {
        if (!user || !profile || !selectedThread || !newPostContent.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const { error: insertError } = await supabase
                .from('posts')
                .insert({ user_id: user.id, thread_id: selectedThread.id, content: newPostContent });

            if (insertError) throw insertError;

            await addXp(5); // +5 XP for reply
            setCooldown(POST_COOLDOWN_SECONDS);
            setNewPostContent('');
            // No need for optimistic update, realtime listener will handle it.

        } catch (err: any) {
            setError(`Gagal bales: ${err.message || 'Terjadi kesalahan.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderView = () => {
        switch (view) {
            case 'thread':
                if (!selectedThread) return <LoadingMessage />;
                const threadAuthor = getOfficialDisplayData(selectedThread.profiles);
                return (
                    <div className="space-y-4">
                        <Button onClick={() => setView('list')} variant="secondary" size="small">&larr; Kembali ke Daftar Topik</Button>
                        <Card title={selectedThread.title}>
                            <div className="border-b border-gray-700 pb-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <img src={threadAuthor.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className={`font-bold ${threadAuthor.isOfficial ? 'text-indigo-400' : 'text-white'}`}>{threadAuthor.name}</p>
                                        <p className="text-xs text-gray-500">{formatRelativeTime(selectedThread.created_at)}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-gray-300 whitespace-pre-wrap selectable-text">{selectedThread.content}</p>
                            </div>

                            {isLoadingPosts ? <LoadingMessage /> : posts.map(post => {
                                const postAuthor = getOfficialDisplayData(post.profiles);
                                return (
                                    <div key={post.id} className="flex items-start gap-3 py-3 border-b border-gray-800 last:border-b-0">
                                        <img src={postAuthor.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                                        <div className="flex-grow">
                                            <div className="flex items-baseline gap-2">
                                                <p className={`font-semibold text-sm ${postAuthor.isOfficial ? 'text-indigo-400' : 'text-white'}`}>{postAuthor.name}</p>
                                                <p className="text-xs text-gray-500">{formatRelativeTime(post.created_at)}</p>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-300 whitespace-pre-wrap selectable-text">{post.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                             
                             {user && selectedThread.id !== '0' && (
                                <div className="mt-6 pt-6 border-t border-indigo-700/50">
                                    <h3 className="font-bold text-lg mb-2 text-white">Kasih Balasan</h3>
                                    <Textarea label="" name="newPostContent" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Ketik balasanmu di sini..." rows={4} />
                                    <div className="mt-3 flex items-center gap-4">
                                        <Button onClick={handleCreatePost} isLoading={isSubmitting} disabled={cooldown > 0 || !newPostContent.trim() || isSubmitting}>
                                            {cooldown > 0 ? `Tunggu ${cooldown} detik lagi...` : 'Kirim Balasan'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                );
            case 'new_thread':
                return (
                     <div>
                        <Button onClick={() => setView('list')} variant="secondary" size="small">&larr; Batal</Button>
                        <Card title="Bikin Topik Baru">
                           <div className="space-y-4">
                                <Input label="Judul Topik" name="newThreadTitle" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} placeholder="Judul yang menarik perhatian..." />
                                <Textarea label="Isi Topik" name="newThreadContent" value={newThreadContent} onChange={(e) => setNewThreadContent(e.target.value)} placeholder="Ceritain unek-unek atau pertanyaan lo di sini..." rows={8} />
                                <div className="flex items-center gap-4">
                                    <Button onClick={handleCreateThread} isLoading={isSubmitting} disabled={cooldown > 0 || !newThreadTitle.trim() || !newThreadContent.trim() || isSubmitting}>
                                        {cooldown > 0 ? `Tunggu ${cooldown} detik lagi...` : 'Posting Topik!'}
                                    </Button>
                                    {cooldown > 0 && <p className="text-sm text-gray-400">Harap tunggu untuk posting lagi.</p>}
                                </div>
                           </div>
                        </Card>
                    </div>
                );
            case 'list':
            default:
                const allThreads = [MANG_AI_WELCOME_THREAD, ...threads];
                return (
                    <div>
                        <WarKopInfoBox />
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl md:text-2xl font-bold text-white">Diskusi Terbaru</h2>
                            <Button onClick={() => user ? setView('new_thread') : alert('Login dulu, Juragan!')}>
                                + Bikin Topik
                            </Button>
                        </div>
                         <div className="text-xs text-gray-400 mb-4 p-2 bg-gray-800/50 rounded-md text-center">
                            💡 Mang AI sekarang bakal ngasih ide topik baru & nimbrung di obrolan secara otomatis, lho! Pantengin terus ya.
                        </div>
                        {isLoadingThreads && threads.length === 0 ? <ThreadListSkeleton /> : (
                            <div className="space-y-2">
                                {allThreads.map(thread => {
                                    const author = getOfficialDisplayData(thread.profiles);
                                    return(
                                        <div
                                            key={thread.id}
                                            className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                                            onClick={() => { setSelectedThread(thread); setView('thread'); }}
                                        >
                                            <img src={author.avatar} alt="avatar" className="w-10 h-10 rounded-full flex-shrink-0" />
                                            <div className="flex-grow overflow-hidden">
                                                <p className={`font-bold truncate ${author.isOfficial ? 'text-indigo-300' : 'text-white'}`}>{thread.title}</p>
                                                <p className="text-xs text-gray-400">
                                                    oleh <span className={`font-semibold ${author.isOfficial ? 'text-indigo-300' : ''}`}>{author.name}</span> • {formatRelativeTime(thread.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-center flex-shrink-0 w-16">
                                                <p className="font-bold text-white">{thread.reply_count || 0}</p>
                                                <p className="text-xs text-gray-500">Balasan</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {hasMoreThreads && (
                            <div className="text-center mt-6">
                                <Button onClick={handleLoadMoreThreads} isLoading={isLoadingMoreThreads} variant="secondary">
                                    Muat Lebih Banyak
                                </Button>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {error && <ErrorMessage message={error} onGoToDashboard={() => { setError(null); setView('list'); }} />}
            {renderView()}
        </div>
    );
};

export default Forum;