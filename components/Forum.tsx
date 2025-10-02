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

    const fetchThreads = useCallback(async () => {
        setIsLoadingThreads(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('threads')
                .select('id, title, created_at, content, profiles(full_name, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(THREADS_PAGE_SIZE);
            if (error) throw error;
            setThreads(data as any);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memuat topik forum.');
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
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles(full_name, avatar_url)')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true })
                .limit(POSTS_PAGE_SIZE);
            if (error) throw error;
            setPosts(data as any);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memuat balasan.');
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const handleSelectThread = (thread: ForumThread) => {
        setSelectedThread(thread);
        setPosts([]);
        fetchPosts(thread.id);
    };

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newThreadTitle.trim() || !newThreadContent.trim()) return;
        setIsSubmitting(true);
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat topik baru.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedThread || !newPostContent.trim()) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('posts').insert({
                user_id: user.id,
                thread_id: selectedThread.id,
                content: newPostContent,
            });
            if (error) throw error;
            setNewPostContent('');
            await fetchPosts(selectedThread.id); // Refresh posts
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mengirim balasan.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const UserAvatar: React.FC<{ postOrThread: ForumThread | ForumPost }> = ({ postOrThread }) => (
        <img
            src={postOrThread.profiles?.avatar_url || 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/default_avatar.png'}
            alt={postOrThread.profiles?.full_name || 'User'}
            className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"
        />
    );

    return (
        <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
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
                            <Button type="submit" isLoading={isSubmitting}>Kirim Topik</Button>
                        </form>
                    </Card>
                )}

                {isLoadingThreads ? <LoadingMessage /> : error ? <ErrorMessage message={error}/> : (
                    <div className="flex flex-col gap-3">
                        {threads.map(thread => (
                            <div
                                key={thread.id}
                                onClick={() => handleSelectThread(thread)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedThread?.id === thread.id ? 'bg-indigo-900/50' : 'bg-gray-800/50 hover:bg-gray-700/50'}`}
                            >
                                <h3 className="font-semibold text-white truncate">{thread.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                    <img src={thread.profiles?.avatar_url || ''} alt="" className="w-4 h-4 rounded-full" />
                                    <span>{thread.profiles?.full_name || 'Anonim'}</span>
                                    <span>•</span>
                                    <span>{new Date(thread.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
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
                                <div className="flex items-start gap-4">
                                    <UserAvatar postOrThread={selectedThread} />
                                    <div className="flex-1">
                                        <p className="font-semibold text-white">{selectedThread.profiles?.full_name}</p>
                                        <p className="text-xs text-gray-500 mb-2">{new Date(selectedThread.created_at).toLocaleString('id-ID')}</p>
                                        <p className="text-gray-300 whitespace-pre-wrap">{selectedThread.content}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Replies */}
                            <div className="flex flex-col gap-4">
                                {isLoadingPosts ? <LoadingMessage /> : posts.map(post => (
                                    <div key={post.id} className="flex items-start gap-4">
                                        <UserAvatar postOrThread={post} />
                                        <div className="flex-1 bg-gray-900/50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-white text-sm">{post.profiles?.full_name}</p>
                                                <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString('id-ID')}</p>
                                            </div>
                                            <p className="text-gray-300 whitespace-pre-wrap mt-1 text-sm">{post.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reply Form */}
                        <div className="mt-6 pt-6 border-t border-gray-700 flex-shrink-0">
                             <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                                <Textarea label={`Balas sebagai ${profile?.full_name || 'Anda'}`} name="reply" value={newPostContent} onChange={e => setNewPostContent(e.target.value)} rows={3} required/>
                                <div className="self-end">
                                    <Button type="submit" isLoading={isSubmitting}>Kirim Balasan</Button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <h2 className="text-lg font-semibold">Selamat Datang di Forum Juragan!</h2>
                        <p>Pilih topik di sebelah kiri untuk mulai ngobrol, atau buat topik baru!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Forum;