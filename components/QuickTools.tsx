// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, lazy, Suspense } from 'react';
import { generateBusinessNames, generateQuickSlogans, generateMoodboardText, generateMoodboardImages } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import CopyButton from './common/CopyButton';

type Tool = 'name' | 'slogan' | 'moodboard';

const GITHUB_ASSETS_URL_TOOLS = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/tools/';

const NameGenerator: React.FC = () => {
    const { deductCredits, addXp, profile } = useAuth();
    const [category, setCategory] = useState('');
    const [keywords, setKeywords] = useState('');
    const [names, setNames] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!category) { setError("Kategori bisnis jangan kosong, ya."); return; }
        if (profile && profile.credits < 1) return; // Auth provider will show modal
        
        setIsLoading(true); setError(null); setNames([]); playSound('start');
        try {
            await deductCredits(1);
            const result = await generateBusinessNames(category, keywords);
            await addXp(5);
            setNames(result);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Error'); playSound('error');
        } finally { setIsLoading(false); }
    }, [category, keywords, deductCredits, addXp, profile]);

    return (
        <Card title="Generator Nama Bisnis">
            <div className="space-y-4">
                <Input label="Produk/Jasa Lo Apa?" name="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="cth: Kopi Susu, Baju Distro, Cuci Sepatu" />
                <Input label="Kata Kunci/Vibe (Opsional)" name="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="cth: modern, ceria, santai" />
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={!category}>Kasih 15 Ide Nama! (1 Token)</Button>
                {error && <ErrorMessage message={error} />}
                {names.length > 0 && (
                    <div className="pt-4 border-t border-border-main">
                        <h4 className="font-semibold text-text-header mb-2">Ini idenya, Juragan:</h4>
                        <div className="columns-2 md:columns-3 gap-2">
                            {names.map((name, i) => <div key={i} className="text-sm bg-background p-2 rounded-md mb-2 break-inside-avoid-column selectable-text">{name}</div>)}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

const SloganGenerator: React.FC = () => {
    const { deductCredits, addXp, profile } = useAuth();
    const [businessName, setBusinessName] = useState('');
    const [keywords, setKeywords] = useState('');
    const [slogans, setSlogans] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!businessName) { setError("Nama bisnis jangan kosong, dong."); return; }
        if (profile && profile.credits < 1) return;
        
        setIsLoading(true); setError(null); setSlogans([]); playSound('start');
        try {
            await deductCredits(1);
            const result = await generateQuickSlogans(businessName, keywords);
            await addXp(5);
            setSlogans(result);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Error'); playSound('error');
        } finally { setIsLoading(false); }
    }, [businessName, keywords, deductCredits, addXp, profile]);

    return (
        <Card title="Generator Slogan Kilat">
            <div className="space-y-4">
                <Input label="Nama Bisnis Lo" name="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="cth: Kopi Senja" />
                <Input label="Kata Kunci/Vibe (Opsional)" name="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="cth: menenangkan, syahdu" />
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={!businessName}>Kasih 10 Ide Slogan! (1 Token)</Button>
                {error && <ErrorMessage message={error} />}
                {slogans.length > 0 && (
                    <div className="pt-4 border-t border-border-main">
                        <h4 className="font-semibold text-text-header mb-2">Pilih slogan andalan lo:</h4>
                        <div className="flex flex-col gap-2">
                            {slogans.map((slogan, i) => <div key={i} className="text-sm bg-background p-2 rounded-md relative pr-10 selectable-text">{slogan}<CopyButton textToCopy={slogan} className="absolute top-1/2 -translate-y-1/2 right-2"/></div>)}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

const MoodboardGenerator: React.FC = () => {
    const { deductCredits, addXp, profile } = useAuth();
    const [keywords, setKeywords] = useState('');
    const [moodboard, setMoodboard] = useState<{ description: string; palette: string[]; images: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!keywords) { setError("Kasih kata kunci dulu, Juragan."); return; }
        if (profile && profile.credits < 2) return;
        
        setIsLoading(true); setError(null); setMoodboard(null); playSound('start');
        try {
            await deductCredits(2);
            const [textData, images] = await Promise.all([
                generateMoodboardText(keywords),
                generateMoodboardImages(keywords)
            ]);
            await addXp(15);
            setMoodboard({ ...textData, images });
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Error'); playSound('error');
        } finally { setIsLoading(false); }
    }, [keywords, deductCredits, addXp, profile]);

    return (
        <Card title="Generator Moodboard Instan">
            <div className="space-y-4">
                <Input label="Jelasin Vibe Brand Lo" name="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="cth: cafe rustic, hangat, nuansa kayu, senja" />
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={!keywords}>Buatin Moodboard! (2 Token)</Button>
                {error && <ErrorMessage message={error} />}
                {isLoading && !moodboard && <LoadingMessage />}
                {moodboard && (
                    <div className="pt-4 border-t border-border-main space-y-4">
                        <div>
                          <p className="text-sm text-text-body mb-2 selectable-text">{moodboard.description}</p>
                          <div className="flex items-center gap-2">
                              {moodboard.palette.map(hex => <div key={hex} title={hex} className="w-8 h-8 rounded-full border-2 border-border-main" style={{backgroundColor: hex}}/>)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {moodboard.images.map((img, i) => <img key={i} src={img} alt={`Moodboard image ${i+1}`} className="w-full h-full object-cover rounded-md aspect-square"/>)}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};


const QuickTools: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>('name');

    const renderTool = () => {
        switch (activeTool) {
            case 'name': return <NameGenerator />;
            case 'slogan': return <SloganGenerator />;
            case 'moodboard': return <MoodboardGenerator />;
            default: return null;
        }
    };
    
    const toolButtons: { id: Tool; name: string; icon: string; }[] = [
        { id: 'name', name: 'Nama Bisnis', icon: GITHUB_ASSETS_URL_TOOLS + 'tool_name.png' },
        { id: 'slogan', name: 'Slogan Kilat', icon: GITHUB_ASSETS_URL_TOOLS + 'tool_slogan.png' },
        { id: 'moodboard', name: 'Moodboard', icon: GITHUB_ASSETS_URL_TOOLS + 'tool_moodboard.png' },
    ];

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-splash mb-2">Perkakas Kilat</h2>
                <p className="text-text-muted max-w-2xl mx-auto">Butuh inspirasi cepet? Pake tools simpel ini buat dapetin ide nama bisnis, slogan, atau moodboard visual dalam hitungan detik.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {toolButtons.map(tool => (
                    <button key={tool.id} onClick={() => { setActiveTool(tool.id); playSound('select'); }}
                        className={`p-4 rounded-lg text-left transition-all duration-200 flex items-center gap-4 ${activeTool === tool.id ? 'bg-primary text-white shadow-lg ring-4 ring-primary/30' : 'bg-surface hover:bg-background'}`}>
                         <img src={tool.icon} alt={tool.name} className="w-10 h-10" />
                         <span className="font-bold">{tool.name}</span>
                    </button>
                ))}
            </div>

            <div className="mt-4">
                {renderTool()}
            </div>
        </div>
    );
};

export default QuickTools;
