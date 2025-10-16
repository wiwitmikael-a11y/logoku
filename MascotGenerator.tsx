// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generateMascot, generateMascotPose } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import { useUserActions } from './contexts/UserActionsContext';
import { playSound } from './services/soundService';
import { getSupabaseClient } from './services/supabaseClient';
import type { Project } from './types';
import Button from './components/common/Button';
import Textarea from './components/common/Textarea';
import ErrorMessage from './components/common/ErrorMessage';
import LoadingMessage from './components/common/LoadingMessage';
import ImageModal from './components/common/ImageModal';

const MASCOT_COST = 2;
const POSE_COST = 1;
const XP_REWARD = 30;

interface MascotGeneratorProps {
    selectedProjectContext: Project | null;
    ownerPhotoCutout: string | null;
}

const MascotGenerator: React.FC<MascotGeneratorProps> = ({ selectedProjectContext, ownerPhotoCutout }) => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [useOwnerInspiration, setUseOwnerInspiration] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
    const [newPosePrompt, setNewPosePrompt] = useState('');
    const [newPoseResult, setNewPoseResult] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingPose, setIsLoadingPose] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
        
    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Deskripsi maskot tidak boleh kosong!'); return; }
        if (useOwnerInspiration && !ownerPhotoCutout) { setError('Aset Persona Juragan belum diproses. Silakan proses dulu di sidebar.'); return; }
        if ((profile?.credits ?? 0) < MASCOT_COST) { setShowOutOfCreditsModal(true); return; }

        let finalPrompt = prompt;
        if (selectedProjectContext?.project_data.selectedPersona) {
            const persona = selectedProjectContext.project_data.selectedPersona;
            finalPrompt += `. Gaya visualnya harus ${persona.kata_kunci.join(', ')} dan cocok dengan warna brand: ${persona.palet_warna_hex.join(', ')}.`;
        }

        setIsLoading(true); setError(null); setResults([]); setSelectedMascot(null); setNewPoseResult(null); playSound('start');
        try {
            if (!(await deductCredits(MASCOT_COST))) throw new Error("Gagal mengurangi token.");
            
            const mascotUrls = await generateMascot(finalPrompt, useOwnerInspiration ? ownerPhotoCutout : undefined);
            setResults(mascotUrls);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat maskot.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGeneratePose = async () => {
        if (!selectedMascot || !newPosePrompt.trim()) return;
        if ((profile?.credits ?? 0) < POSE_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoadingPose(true); setError(null);
        try {
            if (!(await deductCredits(POSE_COST))) throw new Error("Gagal mengurangi token.");
            const poseUrl = await generateMascotPose(selectedMascot, newPosePrompt);
            setNewPoseResult(poseUrl);
            await addXp(10);
        } catch(err) {
            setError(err instanceof Error ? `Gagal membuat pose: ${err.message}` : 'Gagal membuat pose.');
        } finally {
            setIsLoadingPose(false);
        }
    };

    const handleSaveToLemari = async (url: string | null) => {
        if (!user || !url || isSaving) return;
        setIsSaving(true);
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('lemari_kreasi').insert({
            user_id: user.id,
            asset_type: 'mascot',
            name: `Maskot: ${prompt.substring(0, 40)}`,
            asset_data: { urls: [url] }, // Simpan sebagai array untuk konsistensi
        });
        setIsSaving(false);
        if (error) { setError(`Gagal menyimpan: ${error.message}`); }
        else { playSound('success'); alert('Maskot berhasil disimpan ke Lemari Kreasi!'); }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Pabrik Maskot Interaktif</h3>
            <p className="text-sm text-text-body">Ciptakan karakter unik untuk brand-mu. Deskripsikan maskot impianmu, atau biarkan AI terinspirasi dari fotomu untuk membuat maskot yang "kamu banget"!</p>

            {!selectedMascot ? (
                <>
                    <Textarea label="Deskripsi Maskot" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: beruang madu imut pakai blangkon, gaya kartun ceria untuk brand madu" rows={3} />
                    {ownerPhotoCutout && (
                        <div className="flex items-center gap-2 p-2 bg-background rounded-md">
                            <input type="checkbox" id="use-owner" checked={useOwnerInspiration} onChange={e => setUseOwnerInspiration(e.target.checked)} className="h-4 w-4 rounded bg-surface border-border-main text-primary focus:ring-primary"/>
                            <label htmlFor="use-owner" className="text-sm text-text-body">Jadikan Saya Inspirasi Maskot</label>
                        </div>
                    )}
                    <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !prompt.trim()} variant="accent" className="w-full">
                        Buat 2 Opsi Maskot! ({MASCOT_COST} Token, +{XP_REWARD} XP)
                    </Button>
                </>
            ) : (
                <div className="p-4 bg-background rounded-lg border border-border-main space-y-4">
                    <h4 className="font-bold text-text-header">Studio Pose</h4>
                     <img src={selectedMascot} alt="Maskot terpilih" className="max-h-40 mx-auto rounded-md bg-surface p-2" />
                    <Textarea label="Deskripsi Pose Baru" name="pose_prompt" value={newPosePrompt} onChange={e => setNewPosePrompt(e.target.value)} placeholder="Contoh: sedang melambaikan tangan, sedang minum kopi" rows={2} />
                    <div className="flex gap-4">
                        <Button onClick={handleGeneratePose} isLoading={isLoadingPose} disabled={isLoadingPose || !newPosePrompt.trim()} variant="accent">Buat Pose Baru ({POSE_COST} Token)</Button>
                        <Button onClick={() => setSelectedMascot(null)} variant="secondary">Pilih Ulang</Button>
                    </div>
                    {newPoseResult && (
                        <div className="mt-4 pt-4 border-t border-border-light text-center space-y-2">
                             <h5 className="font-semibold">Pose Baru:</h5>
                             <img src={newPoseResult} alt="Pose baru" className="max-h-40 mx-auto rounded-md bg-surface p-2" />
                             <Button size="small" variant="secondary" onClick={() => handleSaveToLemari(newPoseResult)} isLoading={isSaving}>Simpan Pose Ini</Button>
                        </div>
                    )}
                </div>
            )}
            
            {error && <ErrorMessage message={error} />}
            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {results.length > 0 && !selectedMascot && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <h4 className="font-bold text-text-header">Pilih Maskot Favoritmu:</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {results.map((img, i) => (
                            <div key={i} className="p-2 bg-background rounded-lg border-2 border-transparent hover:border-primary cursor-pointer" onClick={() => setSelectedMascot(img)}>
                                <img src={img} alt={`Opsi maskot ${i + 1}`} className="w-full aspect-square object-contain" />
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => { setResults([]); setSelectedMascot(null); }} variant="secondary">Buat Ulang</Button>
                </div>
            )}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Maskot" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default MascotGenerator;