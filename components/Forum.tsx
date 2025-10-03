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

const THREADS_PAGE_SIZE = 15;
const POSTS_PAGE_SIZE = 20;
const POST_COOLDOWN_SECONDS = 30; // Cooldown in seconds

const MANG_AI_ACCOUNT_NAME = "Mang AI";
const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const MANG_AI_AVATAR = `${GITHUB_ASSETS_URL}Mang_AI.png`;

// NEW: Dynamic info box for the forum
const WARUNG_INFO_TIPS = [
    {
        icon: '💡',
        title: 'Aturan Main di WarKop',
        text: 'Biar nongkrongnya asik, kita jaga bareng-bareng ya. Dilarang SARA, no spam, saling support, dan jangan jualan di lapak orang lain. Oke, Juragan?'
    },
    {
        icon: '⭐',
        title: 'Nambah XP Sambil Ngobrol',
        text: 'Setiap lo bikin topik baru atau ngasih balasan yang berbobot, Mang AI bakal kasih bonus <span class="font-bold text-yellow-300">XP</span> buat naikin level kejuraganan lo!'
    },
    {
        icon: '🔥',
        title: 'Jangan Lupa Mampir Pameran!',
        text: 'Udah liat <strong class="text-white">Pameran Brand</strong> belum? Kasih \'Menyala!\' ke karya juragan lain buat nambah XP dan saling semangatin. Karyamu juga bisa dipamerin di sana lho!'
    },
    {
        icon: '💾',
        title: 'PENTING: Amankan Aset Lo!',
        text: 'Mang AI mau ngingetin lagi, semua aset visual (logo, gambar, dll) itu disimpen sementara di browser. <strong class="text-white">Jangan lupa diunduh</strong> biar nggak ilang ya!'
    },
    {
        icon: '🤖',
        title: 'Mang AI Siap Dengerin',
        text: 'Kalau ada ide, kritik, atau nemu yang aneh-aneh di aplikasi, langsung aja bikin topik baru. Masukan dari lo berharga banget buat Mang AI.'
    },
];

const MANG_AI_WELCOME_THREAD: ForumThread = {
  id: '0', // Special ID to prevent reply/fetch logic
  created_at: new Date('2024-09-12T10:00:00Z').toISOString(),
  user_id: 'mang-ai-official',
  title: 'Selamat Datang di WarKop Juragan! ☕ Sokin, Ngopi Sambil Ngobrol!',
  content: `Wih, mantap! Selamat datang di WarKop Juragan, tempat nongkrongnya para pejuang UMKM kreatif se-Indonesia!\n\nAnggap aja ini warung kopi langganan kita. Tempat buat:\n- Pamerin hasil racikan brand dari desain.fun\n- Nanya-nanya soal resep branding & marketing\n- Saling kasih masukan biar bisnis makin ngebul\n- Ngobrol santai ngalor-ngidul bareng sesama juragan\n\nJangan malu-malu, ya! Pesan kopi (bikin topik baru), kenalan dulu, atau nimbrung di obrolan yang udah ada. Mang AI udah siapin kopinya, nih!`,
  profiles: {
    full_name: MANG_AI_ACCOUNT_NAME,
    avatar_url: MANG_AI_AVATAR,
  },
  posts: []
};

const WarKopInfoBox: React.FC = () => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex(prevIndex => (prevIndex + 1) % WARUNG_INFO_TIPS.length);
        }, 8000); // Ganti info setiap 8 detik

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


const Forum: React.FC = () => {
    const { user, profile } = useAuth();
    const [threads, setThreads] = useState<ForumThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    
    const [isLoadingThreads, setIsLoadingThreads] = useState(true);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [showNewThreadForm, setShowNewThreadForm] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(0); // Cooldown timer state

    // Cooldown timer effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);


    const getOfficialDisplayData = (profile: { full_name?: string | null, avatar_url?: string | null } | null) => {
        const isOfficial = profile?.full_name === MANG_AI_ACCOUNT_NAME;
        return {
            isOfficial,
            name: isOfficial ? "Mang AI (Official)" : profile?.full_name || "Juragan Anonim",
            avatar: isOfficial ? MANG_AI_AVATAR : profile?.avatar_url || 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/default_avatar.png',
        };
    };

    const fetchThreads = useCallback(async () => {
        setIsLoadingThreads(true);
        setError(null);
        try {
            // Step 1: Fetch threads without the join
            const { data: threadsData, error: threadsError } = await supabase
                .from('threads')
                .select('id, title, created_at, content, user_id')
                .order('created_at', { ascending: false })
                .limit(THREADS_PAGE_SIZE);

            if (threadsError) throw threadsError;
            if (!threadsData) {
                setThreads([MANG_AI_WELCOME_THREAD]);
                return;
            }
            
            // Step 2: Get unique user IDs
            const userIds = [...new Set(threadsData.map(t => t.user_id))];
            let profilesMap = new Map();

            if (userIds.length > 0) {
                // Step 3: Fetch profiles for those IDs
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds);

                if (profilesError) throw profilesError;
                profilesMap = new Map(profilesData.map(p => [p.id, p]));
            }
            
            // Step 4: Combine threads with their profiles
            const combinedData = threadsData.map(thread => ({
                ...thread,
                profiles: profilesMap.get(thread.user_id) || null
            }));

            // Set final state with the welcome thread prepended
            setThreads([MANG_AI_WELCOME_THREAD, ...combinedData]);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memuat topik forum.');
            setThreads([MANG_AI_WELCOME_THREAD]); // Show welcome thread even on error
        } finally {
            setIsLoadingThreads(false);
        }
    }, []);

    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]);

    const fetchPosts = async (threadId: string) => {
        setIsLoadingPosts(true);
        try {
            // Step 1: Fetch posts
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('id, created_at, user_id, thread_id, content')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true })
                .limit(POSTS_PAGE_SIZE);

            if (postsError) throw postsError;
            if (!postsData) {
                setPosts([]);
                return;
            }

            // Step 2: Get unique user IDs
            const userIds = [...new Set(postsData.map(p => p.user_id))];
            let profilesMap = new Map();
            
            if (userIds.length > 0) {
                 // Step 3: Fetch profiles
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds);
                if (profilesError) throw profilesError;
                profilesMap = new Map(profilesData.map(p => [p.id, p]));
            }

            // Step 4: Combine posts with profiles
            const combinedPosts = postsData.map(post => ({
                ...post,
                profiles: profilesMap.get(post.user_id) || null
            }));
            
            setPosts(combinedPosts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memuat balasan.');
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const handleSelectThread = (thread: ForumThread) => {
        setSelectedThread(thread);
        setPosts([]);
        if (thread.id !== '0') { // Do not fetch posts for static thread
            fetchPosts(thread.id);
        }
    };

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newThreadTitle.trim() || !newThreadContent.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const { error } = await supabase.from('threads').insert({
                user_id: user.id,
                title: newThreadTitle,
                content: newThreadContent,
            });
            if (error) throw error;
            setNewThreadTitle('');
            setNewThreadContent('');
            setShowNewThreadForm(false);
            await fetchThreads();
            setCooldown(POST_COOLDOWN_SECONDS);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Gagal membuat topik baru.';
            if (errorMsg.toLowerCase().includes('security policy')) {
                setError('Waduh, Juragan, jangan ngebut-ngebut! Kasih jeda sebentar sebelum posting lagi ya.');
                setCooldown(10); // Start a small cooldown on frontend if backend rejects
            } else {
                setError(errorMsg);
            }
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
            const { error } = await supabase.from('posts').insert({
                user_id: user.id,
                thread_id: selectedThread.id,
                content: newPostContent,
            });
            if (error) throw error;
            setNewPostContent('');
            await fetchPosts(selectedThread.id); // Refresh posts
            setCooldown(POST_COOLDOWN_SECONDS);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim balasan.';
            if (errorMsg.toLowerCase().includes('security policy')) {
                setError('Waduh, Juragan, jangan ngebut-ngebut! Kasih jeda sebentar sebelum posting lagi ya.');
                setCooldown(10); // Start a small cooldown on frontend if backend rejects
            } else {
                setError(errorMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const UserAvatar: React.FC<{ postOrThread: ForumThread | ForumPost }> = ({ postOrThread }) => {
        const author = getOfficialDisplayData(postOrThread.profiles);
        return (
            <img
                src={author.avatar}
                alt={author.name}
                className={`w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 ${author.isOfficial ? 'p-1 bg-amber-200' : ''}`}
                style={author.isOfficial ? { imageRendering: 'pixelated' } : {}}
            />
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* NEW Info Box */}
            <WarKopInfoBox />
            
            <div className="flex flex-col md:flex-row gap-6">
            {/* Thread List */}
            <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">Topik Diskusi</h2>
                    <Button size="small" onClick={() => setShowNewThreadForm(p => !p)}>{showNewThreadForm ? 'Batal' : '+ Topik Baru'}</Button>
                </div>
                {showNewThreadForm && (
                    <Card title="Buat Topik Baru">
                        <form onSubmit={handleCreateThread} className="flex flex-col gap-4">
                            <Input label="Judul Topik" name="title" value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} required />
                            <Textarea label="Isi Topik" name="content" value={newThreadContent} onChange={e => setNewThreadContent(e.target.value)} rows={4} required />
                            <div className="flex items-center gap-4">
                                <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || cooldown > 0}>Kirim Topik</Button>
                                {cooldown > 0 && (
                                    <p className="text-sm text-yellow-400 animate-pulse">
                                        Tunggu {cooldown}d...
                                    </p>
                                )}
                            </div>
                        </form>
                    </Card>
                )}

                {isLoadingThreads ? <LoadingMessage /> : error && threads.length <= 1 ? <ErrorMessage message={error}/> : (
                    threads.length <= 1 && !showNewThreadForm ? ( // Check if only the welcome thread exists
                        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                            <p className="text-gray-400 text-sm">WarKop masih sepi, Mang! Sokin, bikin obrolan pertama!</p>
                             <Button size="small" onClick={() => setShowNewThreadForm(true)} className="mt-4">Bikin Topik Pertama</Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {threads.map(thread => {
                                const threadAuthor = getOfficialDisplayData(thread.profiles);
                                return (
                                    <div
                                        key={thread.id}
                                        onClick={() => handleSelectThread(thread)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedThread?.id === thread.id ? 'bg-indigo-900/50' : 'bg-gray-800/50 hover:bg-gray-700/50'} ${threadAuthor.isOfficial ? 'border-l-4 border-amber-400' : ''}`}
                                    >
                                        <h3 className="font-semibold text-white truncate">{thread.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                            <img src={threadAuthor.avatar} alt={threadAuthor.name} className={`w-4 h-4 rounded-full ${threadAuthor.isOfficial ? 'p-0.5 bg-amber-200' : ''}`} style={threadAuthor.isOfficial ? { imageRendering: 'pixelated' } : {}}/>
                                            <span className={threadAuthor.isOfficial ? 'font-bold text-amber-300' : ''}>{threadAuthor.name}</span>
                                            <span>•</span>
                                            <span>{new Date(thread.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </aside>

            {/* Post View */}
            <main className="w-full md:w-2/3 lg:w-3/4 bg-gray-800/50 rounded-lg p-4 md:p-6 min-h-[60vh] flex flex-col">
                {selectedThread ? (
                    <>
                        <div className="flex-grow overflow-y-auto pr-2">
                             {/* Original Post */}
                            <div className="pb-4 mb-4 border-b border-gray-700">
                                <h1 className="text-xl md:text-2xl font-bold text-indigo-400 mb-3">{selectedThread.title}</h1>
                                {(() => {
                                    const mainPostAuthor = getOfficialDisplayData(selectedThread.profiles);
                                    return (
                                        <div className={`flex items-start gap-4 ${mainPostAuthor.isOfficial ? 'bg-amber-900/20 p-4 rounded-lg' : ''}`}>
                                            <UserAvatar postOrThread={selectedThread} />
                                            <div className="flex-1">
                                                <p className={`font-semibold ${mainPostAuthor.isOfficial ? 'text-amber-300' : 'text-white'}`}>{mainPostAuthor.name}</p>
                                                <p className="text-xs text-gray-500 mb-2">{new Date(selectedThread.created_at).toLocaleString('id-ID')}</p>
                                                <p className="text-gray-300 whitespace-pre-wrap">{selectedThread.content}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Replies */}
                            <div className="flex flex-col gap-4">
                                {isLoadingPosts ? <LoadingMessage /> : posts.map(post => {
                                    const postAuthor = getOfficialDisplayData(post.profiles);
                                    return (
                                        <div key={post.id} className="flex items-start gap-4">
                                            <UserAvatar postOrThread={post} />
                                            <div className={`flex-1 p-3 rounded-lg ${postAuthor.isOfficial ? 'bg-amber-900/30' : 'bg-gray-900/50'}`}>
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-semibold text-sm ${postAuthor.isOfficial ? 'text-amber-300' : 'text-white'}`}>{postAuthor.name}</p>
                                                    <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString('id-ID')}</p>
                                                </div>
                                                <p className="text-gray-300 whitespace-pre-wrap mt-1 text-sm">{post.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reply Form */}
                        {selectedThread.id !== '0' && ( // Don't show reply form for static thread
                             <div className="mt-6 pt-6 border-t border-gray-700 flex-shrink-0">
                                 <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                                    <Textarea label={`Balas sebagai ${profile?.full_name || 'Anda'}`} name="reply" value={newPostContent} onChange={e => setNewPostContent(e.target.value)} rows={3} required/>
                                    <div className="self-end flex items-center gap-4">
                                        {cooldown > 0 && (
                                            <p className="text-sm text-yellow-400 animate-pulse">
                                                Tunggu {cooldown}d...
                                            </p>
                                        )}
                                        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || cooldown > 0}>Kirim Balasan</Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <h2 className="text-lg font-semibold">Selamat Datang di WarKop Juragan!</h2>
                        <p>Pilih topik di sebelah kiri untuk mulai ngobrol, atau buat topik baru!</p>
                    </div>
                )}
            </main>
            </div>
        </div>
    );
};

export default Forum;