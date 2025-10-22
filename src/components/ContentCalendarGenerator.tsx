// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateContentCalendar } from '../services/geminiService';
import { useUI } from '../contexts/UIContext';
import type { Project, ProjectData, ContentCalendarEntry } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';
import CopyButton from './common/CopyButton';

const CALENDAR_COST = 5;
const XP_REWARD = 75;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
    onComplete: () => void;
}

const ContentCalendarGenerator: React.FC<Props> = ({ project, onUpdateProject, onComplete }) => {
    const { deductCredits, addXp } = useUserActions();
    const { setCrossComponentPrompt } = useUI();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { selectedPersona, brandInputs, contentCalendar } = project.project_data;

    const handleGenerate = async () => {
        if (!selectedPersona || !brandInputs) return;

        setIsLoading(true);
        setError(null);
        try {
            if (!(await deductCredits(CALENDAR_COST))) return;

            const calendar = await generateContentCalendar(brandInputs, selectedPersona);
            await onUpdateProject({ contentCalendar: calendar });
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat kalender konten.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateVisual = (idea: string) => {
        const prompt = `Buat gambar untuk postingan media sosial dengan ide: "${idea}". Gaya visual harus sesuai dengan brand ${project.project_data.project_name}.`;
        setCrossComponentPrompt({ targetTool: 'Studio Foto', prompt });
    };

    if (!selectedPersona || !project.project_data.selectedLogoUrl) {
        return (
            <div className="text-center p-8 bg-background rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <span className="text-5xl mb-4">🗓️</span>
                <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Persona & Logo Dulu!</h2>
                <p className="mt-2 text-text-muted max-w-md">Perencanaan konten butuh kepribadian yang jelas. Silakan lengkapi langkah 1 & 2 di tab sebelumnya, Juragan.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Langkah 4: Jadwal Konten Cerdas</h3>
                    <p className="text-sm text-text-body mt-1">Nggak perlu pusing lagi mikirin mau posting apa! Mang AI bakal bikinin jadwal konten 7 hari lengkap dengan ide, draf caption, sampe hashtag yang lagi ngetren. Dijamin sosmed-mu makin rame!</p>
                </div>
            </div>

            {error && <ErrorMessage message={error}/>}

            <div className="text-center">
                 <Button onClick={handleGenerate} isLoading={isLoading} variant="primary">
                    {contentCalendar ? 'Buat Ulang Rencana Konten' : 'Buat Rencana Konten 7 Hari!'} ({CALENDAR_COST} ✨)
                </Button>
            </div>

            {contentCalendar && (
                <div className="animate-content-fade-in space-y-4">
                    <div className="overflow-x-auto bg-background rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface text-xs text-text-header uppercase">
                                <tr>
                                    <th className="px-4 py-3">Hari</th>
                                    <th className="px-4 py-3">Tipe Konten</th>
                                    <th className="px-4 py-3">Ide & Caption</th>
                                    <th className="px-4 py-3">Hashtag</th>
                                    <th className="px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contentCalendar.plan.map((entry, index) => (
                                    <tr key={index} className="border-b border-border-main hover:bg-surface">
                                        <td className="px-4 py-3 font-semibold">{entry.day}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{entry.contentType}</span></td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-text-header">{entry.idea}</p>
                                            <p className="text-text-muted italic">"{entry.caption}"</p>
                                        </td>
                                        <td className="px-4 py-3 text-accent text-xs break-all">{entry.hashtags}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <CopyButton textToCopy={`Ide: ${entry.idea}\n\nCaption: ${entry.caption}\n\n${entry.hashtags}`} />
                                                <Button onClick={() => handleCreateVisual(entry.idea)} size="small" variant="secondary" title="Buat visual di Sotoshop">
                                                    🎨
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {contentCalendar.sources.length > 0 && (
                        <div className="p-3 bg-background rounded-lg text-xs">
                            <p className="font-semibold text-text-muted mb-2">Sumber Inspirasi dari Google:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {contentCalendar.sources.map((source, i) => (
                                    <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{source.title}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mt-6 pt-6 border-t border-border-main text-center animate-content-fade-in">
                        <Button onClick={onComplete} variant="accent">
                            Lanjut ke Sotoshop →
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentCalendarGenerator;