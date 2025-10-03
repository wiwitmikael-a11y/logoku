// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback } from 'react';
import { generateBusinessNames } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import ErrorMessage from './common/ErrorMessage';
import CopyButton from './common/CopyButton';

const GENERATION_COST = 1;
const XP_REWARD = 15;

const QuickTools: React.FC = () => {
    const { profile, deductCredits, addXp, setShowOutOfCreditsModal } = useAuth();
    const credits = profile?.credits ?? 0;

    const [category, setCategory] = useState('');
    const [keywords, setKeywords] = useState('');
    const [names, setNames] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!category) {
            setError('Isi dulu produk/jasa yang dijual, Juragan!');
            return;
        }
        if (credits < GENERATION_COST) {
            setShowOutOfCreditsModal(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setNames([]);

        try {
            const result = await generateBusinessNames(category, keywords);
            await deductCredits(GENERATION_COST);
            await addXp(XP_REWARD);
            setNames(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
        } finally {
            setIsLoading(false);
        }
    }, [category, keywords, credits, deductCredits, addXp, setShowOutOfCreditsModal]);

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Warung Ide Mang AI 💡</h2>
                <p className="text-gray-400">
                    Butuh inspirasi cepat? Di sini tempatnya! Mang AI sediain alat-alat bantu praktis buat kebutuhan branding dadakan lo.
                </p>
            </div>

            <Card title="Generator Nama Bisnis">
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-400">
                        Masih bingung cari nama yang pas? Ceritain bisnis lo, biar Mang AI kasih ide nama yang kece dan gampang diingat. (+{XP_REWARD} XP)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Produk/Jasa yang Dijual"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="cth: Kopi Susu Gula Aren"
                            required
                        />
                        <Input 
                            label="Kata Kunci / Vibe (Opsional)"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="cth: senja, santai, modern"
                        />
                    </div>
                    <div className="self-start">
                        <Button onClick={handleGenerate} isLoading={isLoading} disabled={!category || isLoading}>
                            Kasih Ide Nama! ({GENERATION_COST} Token)
                        </Button>
                    </div>

                    {error && <ErrorMessage message={error} />}

                    {names.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h3 className="font-semibold text-white mb-3">Ini dia, 15 ide nama buat lo:</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {names.map((name, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-md">
                                        <CopyButton textToCopy={name} />
                                        <span className="text-sm text-gray-300 flex-grow selectable-text">{name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
            
            <Card title="Generator Slogan (Segera Hadir)">
                 <p className="text-sm text-gray-500 italic">
                    Lagi diracik sama Mang AI. Nanti di sini lo bisa bikin slogan keren cuma modal nama bisnis dan beberapa kata kunci. Ditunggu ya!
                </p>
            </Card>
        </div>
    );
};

export default QuickTools;