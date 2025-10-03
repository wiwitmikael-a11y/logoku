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
        
        const