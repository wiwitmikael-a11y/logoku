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
import { moderateContent } from '../services/geminiService';

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
    { icon: '⭐', title: 'Nambah XP Sambil Ngobrol', text: 'Setiap lo bikin topik baru atau ngasih balasan yang berbobot, Mang AI bakal kasih bonus <span class="font-bold text-splash">XP</span> buat naikin level kejuraganan lo!' },
    { icon: '🔥', title: 'Jangan Lupa Mampir Pameran!', text: 'Udah liat <strong class="text-text-header">Pameran Brand</strong> belum? Kasih \'Menyala!\' ke karya juragan lain buat nambah XP dan saling semangatin. Karyamu juga bisa dipamerin di sana lho!' },
    { icon: '💾', title: 'PENTING: Amankan Aset Lo!', text: 'Mang AI mau ngingetin lagi, semua aset visual (logo, gambar, dll) itu disimpen sementara di browser. <strong class="text-text-header">Jangan lupa diunduh</strong> biar nggak ilang ya!' },
    { icon: '🤖', title: 'Mang AI Siap Dengerin', text: 'Kalau ada ide, kritik, atau nemu yang aneh-aneh di aplikasi, langsung aja bikin topik baru. Masukan dari lo berharga banget buat Mang AI.' },
];

const MANG_AI_WELCOME_THREAD: ForumThread = {
  id: '0',
  created_at: new Date('2024-09-12T10:00:00Z').toISOString(),
  user_id: 'mang-ai-official',
  title: 'Selamat Datang di WarKop Juragan! ☕ Sokin, Ngopi Sambil Ngobrol!',
  content: `Wih, mantap! Selamat datang di WarKop Juragan, tempat nongkrongnya para pejuang UMKM kreatif se-Indonesia!\n\nAnggap aja ini warung kopi langgangan kita. Tempat buat:\n- Pamerin hasil racikan brand dari desain.fun\n- Nanya-nanya soal resep branding & marketing\n- Saling kasih masukan biar bisnis makin ngebul\n- Ngobrol santai ngalor-ngidul bareng sesama juragan\n\nJangan malu-malu, ya! Pesan kopi (bikin topik baru), kenalan dulu, atau nimbrung di obrolan yang udah ada. Mang AI udah siapin kopinya, nih!`,
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
        <div key={currentTipIndex} className="w-full bg-surface border border-border-main rounded-lg p-4 flex items-start gap-4 text-left animate-content-fade-in shadow-lg shadow-black/20 mb-8">
            <div className="flex-shrink-0 text-2xl pt-1">{currentTip.icon}</div>
            <div>
                <h4 className="font-bold text-text-header">{currentTip.title}</h4>
                <p className="text-sm text-text-body" dangerouslySetInnerHTML={{ __html: currentTip.text }} />
            </div>
        </div>
    );
};

const ThreadListSkeleton: React.FC = () => (
    <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-surface rounded-lg animate-pulse">
                <div className="w-10 h-10 rounded-full bg-background flex-shrink-0"></div>
                <div className="flex-grow">
                    <div className="h-4 bg-background rounded w-3/4"></div>
                    <div className="h-3 bg-background rounded w-1/2 mt-2"></div>
                </div>
                <div className="w-16 h-8 bg-background rounded-md"></div>
                <div className="w-24 h-8 bg-background rounded-md hidden sm:block"></div>
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
            const { data, error: threadsError, count } = await supabase
                .from('threads')
                .select('*, profiles(full_name, avatar_url)', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (threadsError) throw threadsError;
            
            const threadIds = data.map(t => t.id);
            if(threadIds.length === 0) {
                 setThreads(prev => pageNum === 0 ? [] : prev);
                 setHasMoreThreads(false);
                 return;
            }
            
            const { data: replyCounts, error: rpcError } = await supabase.rpc('get_reply_counts', { t_ids: threadIds });
            if (rpcError) console.warn("Could not fetch reply counts:", rpcError.message);

            const threadsWithCounts = data.map(thread => {
                const countData = replyCounts?.find((c: any) => c.thread_id === thread.id);
                return { ...thread, reply_count: countData?.reply_count || 0 };
            });

            const allThreads = pageNum === 0 ? threadsWithCounts : [...threads, ...threadsWithCounts];
            const uniqueThreads = Array.from(new Map(allThreads.map(t => [t.id, t])).values());

            setThreads(uniqueThreads);
            setHasMoreThreads(uniqueThreads.length < (count || 0));

        } catch (err: any) {
            setError(`Gagal memuat topik: ${err.message}`);
        } finally {
            setIsLoadingThreads(false);
            setIsLoadingMoreThreads(false);
        }
    }, [threads]);
    
    useEffect(() => {
        fetchThreads(0);
    }, []);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    useEffect(() => {
        const channel = supabase.channel('public:threads')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threads' }, async (payload) => {
                const newThread = payload.new as ForumThread;
                const { data: profileData } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', newThread.user_id).single();
                newThread.profiles = profileData;
                newThread.reply_count = 0;
                setThreads(currentThreads => [newThread, ...currentThreads]);
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchPosts = async (threadId: string) => {
        if (threadId === '0') {
            setPosts([]);
            return;
        }
        setIsLoadingPosts(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('posts').select('*, profiles(full_name, avatar_url)').eq('thread_id', threadId).order('created_at', { ascending: true }).limit(POSTS_PAGE_SIZE);
            if (error) throw error;
            setPosts(data as ForumPost[]);
        } catch (err: any) {
            setError(`Gagal memuat balasan: ${err.message}`);
        } finally {
            setIsLoadingPosts(false);
        }
    };
    
    const handleSelectThread = (thread: ForumThread) => {
        setSelectedThread(thread);
        setView('thread');
        fetchPosts(thread.id);
    };

    const handleBackToList = () => {
        setSelectedThread(null);
        setPosts([]);
        setView('list');
    };
    
    const handleCooldown = () => {
        setCooldown(POST_COOLDOWN_SECONDS);
        localStorage.setItem('post_cooldown_end', (Date.now() + POST_COOLDOWN_SECONDS * 1000).toString());
    };
    
    const handleSubmitNewThread = async () => {
        if (!user || !newThreadTitle.trim() || !newThreadContent.trim()) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const moderation = await moderateContent(`${newThreadTitle} ${newThreadContent}`);
            if (!moderation.isAppropriate) {
                setError(`Konten lo kurang pas, Juragan: ${moderation.reason}`);
                return;
            }
            const { error } = await supabase.from('threads').insert({ user_id: user.id, title: newThreadTitle, content: newThreadContent });
            if (error) throw error;
            await addXp(15);
            setNewThreadTitle('');
            setNewThreadContent('');
            setView('list');
            fetchThreads(0);
            handleCooldown();
        } catch (err: any) {
            setError(`Gagal bikin topik baru: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitPost = async () => {
        if (!user || !selectedThread || !newPostContent.trim()) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const moderation = await moderateContent(newPostContent);
            if (!moderation.isAppropriate) {
                setError(`Balasan lo kurang pas, Juragan: ${moderation.reason}`);
                return;
            }
            const { data, error } = await supabase.from('posts').insert({ user_id: user.id, thread_id: selectedThread.id, content: newPostContent }).select('*, profiles(full_name, avatar_url)').single();
            if (error) throw error;
            await addXp(5);
            setPosts(prev => [...prev, data as ForumPost]);
            setNewPostContent('');
            handleCooldown();
        } catch (err: any) {
            setError(`Gagal posting balasan: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (view === 'new_thread') {
        return (
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <Button onClick={() => setView('list')} variant="secondary" className="self-start">&larr; Balik ke WarKop</Button>
                <Card title="Bikin Topik Baru">
                    <div className="flex flex-col gap-4">
                        <Input label="Judul Topik" value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} placeholder="Tulis judul yang menarik..." />
                        <Textarea label="Isi Topik" value={newThreadContent} onChange={e => setNewThreadContent(e.target.value)} placeholder="Ceritain lebih detail di sini..." rows={8} />
                        <Button onClick={handleSubmitNewThread} isLoading={isSubmitting} disabled={cooldown > 0}> {cooldown > 0 ? `Tunggu ${cooldown} detik...` : "Posting Topik (+15 XP)"} </Button>
                    </div>
                </Card>
                {error && <ErrorMessage message={error} />}
            </div>
        );
    }
    
    if (view === 'thread' && selectedThread) {
        const { isOfficial, name, avatar } = getOfficialDisplayData(selectedThread.profiles);
        return (
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <Button onClick={handleBackToList} variant="secondary" className="self-start">&larr; Balik ke WarKop</Button>
                <Card title={selectedThread.title}>
                    <div className="flex items-start gap-4 border-b border-border-main pb-4">
                        <img src={avatar} alt={name} className="w-12 h-12 rounded-full" />
                        <div>
                            <p className={`font-bold ${isOfficial ? 'text-splash' : 'text-text-header'}`}>{name}</p>
                            <p className="text-xs text-text-muted">{formatRelativeTime(selectedThread.created_at)}</p>
                        </div>
                    </div>
                    <div className="prose prose-sm prose-invert mt-4 max-w-none text-text-body whitespace-pre-wrap selectable-text">{selectedThread.content}</div>
                </Card>

                <h3 className="text-xl font-bold text-text-header mt-4">Balasan Juragan:</h3>
                {isLoadingPosts ? <LoadingMessage /> : error ? <ErrorMessage message={error}/> : (
                    <div className="flex flex-col gap-4">
                        {posts.length === 0 && selectedThread.id !== '0' && <p className="text-text-muted text-sm">Belum ada yang nimbrung. Jadilah yang pertama!</p>}
                        {posts.map(post => {
                            const postAuthor = getOfficialDisplayData(post.profiles);
                            return (
                                <div key={post.id} className="flex items-start gap-3 bg-surface p-4 rounded-lg">
                                    <img src={postAuthor.avatar} alt={postAuthor.name} className="w-10 h-10 rounded-full" />
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className={`font-bold text-sm ${postAuthor.isOfficial ? 'text-splash' : 'text-text-header'}`}>{postAuthor.name}</p>
                                            <p className="text-xs text-text-muted">{formatRelativeTime(post.created_at)}</p>
                                        </div>
                                        <p className="text-text-body whitespace-pre-wrap text-sm selectable-text">{post.content}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                
                {selectedThread.id !== '0' ? (
                     <Card title="Kasih Komentar Lo">
                         <div className="flex flex-col gap-4">
                             <Textarea label={`Membalas sebagai ${profile?.full_name || 'Juragan'}`} value={newPostContent} onChange={e => setNewPostContent(e.target.value)} rows={4} />
                             <Button onClick={handleSubmitPost} isLoading={isSubmitting} disabled={cooldown > 0}>{cooldown > 0 ? `Tunggu ${cooldown} detik...` : "Kirim Balasan (+5 XP)"}</Button>
                         </div>
                     </Card>
                ) : (
                    <div className="text-center text-sm p-4 bg-surface rounded-lg text-text-muted">
                        Ini topik sambutan dari Mang AI. Yuk, nimbrung di topik lain atau bikin topik baru!
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <WarKopInfoBox />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-splash">WarKop Juragan</h2>
                <Button onClick={() => setView('new_thread')} disabled={cooldown > 0}> {cooldown > 0 ? `Tunggu ${cooldown}s` : "+ Bikin Topik Baru"} </Button>
            </div>

            {error && <ErrorMessage message={error} />}
            {isLoadingThreads ? <ThreadListSkeleton /> : (
                <div className="flex flex-col gap-2">
                    {[MANG_AI_WELCOME_THREAD, ...threads].map(thread => {
                        const { isOfficial, name, avatar } = getOfficialDisplayData(thread.profiles);
                        return (
                            <div key={thread.id} onClick={() => handleSelectThread(thread)} className="flex items-center gap-4 p-4 bg-surface rounded-lg cursor-pointer hover:bg-background transition-colors">
                                <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
                                <div className="flex-grow">
                                    <p className="font-bold text-text-header hover:text-primary transition-colors">{thread.title}</p>
                                    <p className="text-xs text-text-muted">oleh <span className={isOfficial ? 'text-splash font-semibold' : ''}>{name}</span> - {formatRelativeTime(thread.created_at)}</p>
                                </div>
                                <div className="text-center w-16 hidden sm:block">
                                    <p className="font-bold text-lg text-text-header">{thread.reply_count || 0}</p>
                                    <p className="text-xs text-text-muted">Balasan</p>
                                </div>
                                 <div className="text-center w-24 hidden md:block">
                                    <p className="text-sm font-semibold text-text-header">N/A</p>
                                    <p className="text-xs text-text-muted">Dilihat</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {hasMoreThreads && (
                 <div className="mt-6 text-center">
                    <Button onClick={() => fetchThreads(threadsPage + 1)} isLoading={isLoadingMoreThreads} variant="secondary">Muat Lebih Banyak</Button>
                </div>
            )}
        </div>
    );
};

export default Forum;