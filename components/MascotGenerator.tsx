// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generateMascot, generateMascotPose, removeBackground } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import { supabase } from '../services/supabaseClient';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';

const INITIAL_COST = 2;
const POSES_COST = 2;
const BG_REMOVAL_COST = 1;
const XP_REWARD = 25;

type Step = 'prompt' | 'options' | 'poses';

const MascotGenerator: React.FC = () => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [step, setStep] = useState<Step>('prompt');
    const [initialOptions, setInitialOptions] = useState<string[]>([]);
    const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
    const [poses, setPoses] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    const handleGenerateInitial = async () => {
        if (!prompt.trim()) { setError('Deskripsi maskot tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < INITIAL_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setInitialOptions([]); setSelectedMascot(null); setPoses([]); playSound('start');
        try {
            if (!(await deductCredits(INITIAL_COST))) throw new Error("Gagal mengurangi token.");
            const results = await generateMascot(prompt);
            setInitialOptions(results);
            setStep('options');
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat maskot.'); playSound('error'); }
        finally { setIsLoading(false); }
    };

    const handleGeneratePoses = async () => {
        if (!selectedMascot) return;
        if ((profile?.credits ?? 0) < POSES_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setPoses([]); playSound('start');
        try {
            if (!(await deductCredits(POSES_COST))) throw new Error("Gagal mengurangi token.");
            const posePrompts = ["pose jempol 👍 (thumbs up)", "pose dadah 👋 (waving)", "pose mikir 🤔 (thinking)"];
            const posePromises = posePrompts.map(p => generateMascotPose(selectedMascot, p));
            const generatedPoses = await Promise.all(posePromises);
            setPoses(generatedPoses);
            setStep('poses');
            await addXp(10);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat pose.'); playSound('error'); }
        finally { setIsLoading(false); }
    };
    
    const handleRemoveBackground = async (url: string, index: number) => {
        if (!url || isLoading) return;
        if ((profile?.credits ?? 0) < BG_REMOVAL_COST) { setShowOutOfCreditsModal(true); return; }
        
        setIsLoading(true); setError(null); playSound('start');
        try {
            if (!(await deductCredits(BG_REMOVAL_COST))) throw new Error("Gagal mengurangi token.");
            const transparentUrl = await removeBackground(url);
            
            // Update the correct image state
            if (index === -1) { // This is the main selected mascot
                setSelectedMascot(transparentUrl);
            } else { // This is one of the poses
                setPoses(currentPoses => currentPoses.map((p, i) => i === index ? transparentUrl : p));
            }

            setModalImageUrl(transparentUrl); // Show the result in modal
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menghapus background.'); playSound('error'); }
        finally { setIsLoading(false); }
    }

    const handleSaveToLemari = async () => {
        if (!user || !selectedMascot || isSaving) return;
        setIsSaving(true);
        const asset_data = { urls: [selectedMascot, ...poses] };
        const { error } = await supabase.from('lemari_kreasi').insert({
            user_id: user.id,
            asset_type: 'mascot',
            name: `Maskot: ${prompt.substring(0, 40)}`,
            asset_data,
        });
        setIsSaving(false);
        if (error) { setError(`Gagal menyimpan: ${error.message}`); }
        else { playSound('success'); alert('Paket maskot berhasil disimpan ke Lemari Kreasi!'); }
    };
    
    const reset = () => { setStep('prompt'); setInitialOptions([]); setSelectedMascot(null); setPoses([]); setError(null); }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Pabrik Maskot Interaktif</h3>
            <p className="text-sm text-text-body">Ciptakan karakter yang mudah diingat untuk brand-mu. Cukup deskripsikan, pilih favoritmu, lalu Mang AI akan buatkan pose tambahan. Setiap langkah punya biayanya sendiri.</p>

            {step === 'prompt' && (
                <div className="space-y-4 animate-content-fade-in">
                    <Textarea label="Deskripsi Maskot" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: beruang madu imut pakai blangkon, gaya kartun 2D" rows={3} />
                    <Button onClick={handleGenerateInitial} isLoading={isLoading} disabled={isLoading || !prompt.trim()} variant="accent" className="w-full">Buat 2 Opsi Awal ({INITIAL_COST} Token, +{XP_REWARD} XP)</Button>
                </div>
            )}
            
            {error && <ErrorMessage message={error} />}
            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {step === 'options' && (
                <div className="space-y-4 animate-content-fade-in">
                    <h4 className="font-bold text-text-header">Pilih Karakter Favoritmu:</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {initialOptions.map((img, i) => (
                            <img key={i} src={img} onClick={() => setSelectedMascot(img)} alt={`Opsi ${i+1}`} className={`w-full aspect-square object-contain rounded-lg cursor-pointer border-4 transition-colors ${selectedMascot === img ? 'border-primary' : 'border-transparent hover:border-splash/50'}`} />
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={handleGeneratePoses} disabled={!selectedMascot || isLoading} variant="accent">Buatkan 3 Pose Tambahan ({POSES_COST} Token)</Button>
                        <Button onClick={reset} variant="secondary">Ulangi dari Awal</Button>
                    </div>
                </div>
            )}
            
            {step === 'poses' && selectedMascot && (
                <div className="space-y-4 animate-content-fade-in">
                    <h4 className="font-bold text-text-header">Paket Pose Lengkap:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <img src={selectedMascot} onClick={() => setModalImageUrl(selectedMascot)} alt="Pose utama" className="w-full aspect-square object-contain rounded-lg cursor-pointer bg-background" />
                            <Button onClick={() => handleRemoveBackground(selectedMascot, -1)} isLoading={isLoading} size="small" variant="secondary" className="mt-2 w-full text-xs">Hapus BG ({BG_REMOVAL_COST}T)</Button>
                        </div>
                        {poses.map((img, i) => (
                            <div key={i} className="text-center">
                                <img src={img} onClick={() => setModalImageUrl(img)} alt={`Pose ${i}`} className="w-full aspect-square object-contain rounded-lg cursor-pointer bg-background" />
                                <Button onClick={() => handleRemoveBackground(img, i)} isLoading={isLoading} size="small" variant="secondary" className="mt-2 w-full text-xs">Hapus BG ({BG_REMOVAL_COST}T)</Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={handleSaveToLemari} isLoading={isSaving} variant="accent">Simpan Paket Maskot</Button>
                        <Button onClick={reset} variant="secondary">Buat Maskot Baru</Button>
                    </div>
                </div>
            )}

            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Maskot" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default MascotGenerator;