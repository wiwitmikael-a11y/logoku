// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateContentCalendar } from '../services/geminiService';
import type { Project, ProjectData, ContentCalendarEntry } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const CALENDAR_COST = 10;
const XP_REWARD = 150;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const ContentCalendarGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { deductCredits, addXp } = useUserActions();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { selectedPersona, contentCalendar, calendarSources } = project.project_data;

    const handleGenerate = async () => {
        if (!selectedPersona) {
            setError('Pilih Persona Brand terlebih dahulu di tab "Persona".');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            if (!(await deductCredits(CALENDAR_COST))) return;

            const { calendar, sources } = await generateContentCalendar(project.project_name, selectedPersona);
            await onUpdateProject({ contentCalendar: calendar, calendarSources: sources });
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat kalender.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!selectedPersona) {
        return (
            <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <span className="text-5xl mb-4">👤</span>
                <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Persona Dulu, Juragan!</h2>
                <p className="mt-2 text-text-muted max-w-md">Mang AI butuh persona brand buat nentuin gaya bahasa dan topik yang pas. Silakan lengkapi langkah pertama di tab "Persona".</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-16 h-16" style={{ imageRendering: 'pixelated' }} />
                <div>
                    <h4 className="font-bold text-text-header">Biar Konten Nggak Monoton!</h4>
                    <p className="text-sm text-text-body mt-1">Mang AI bakal cariin ide-ide segar yang lagi tren di Google, terus dibikinin jadwal lengkap biar sosmed-mu makin rame. Tinggal klik, jadi deh rencana 7 hari!</p>
                </div>
            </div>

            <div className="p-6 bg-surface rounded-lg text-center">
                <h3 className="text-2xl font-bold text-text-header mb-4" style={{fontFamily: 'var(--font-display)'}}>Rencana Konten Media Sosial</h3>
                 <p className="text-sm text-text-muted mb-6 max-w-2xl mx-auto">Dapatkan draf rencana konten untuk 7 hari ke depan, lengkap dengan ide, caption, dan hashtag yang disesuaikan dengan persona brand <span className="font-bold text-accent">{selectedPersona.nama_persona}</span>.</p>
                <Button onClick={handleGenerate} isLoading={isLoading} variant="primary" size="large">
                    Buat Rencana Konten 7 Hari! ({CALENDAR_COST} Token, +{XP_REWARD} XP)
                </Button>
                 {error && <div className="mt-4"><ErrorMessage message={error}/></div>}
            </div>

            {contentCalendar && contentCalendar.length > 0 && (
                <div className="animate-content-fade-in space-y-4">
                    <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Hasil Rencana Konten:</h3>
                    <div className="overflow-x-auto bg-surface rounded-lg p-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-background text-xs text-text-muted uppercase">
                                <tr>
                                    <th className="p-3">Hari</th>
                                    <th className="p-3">Tipe Konten</th>
                                    <th className="p-3">Ide Konten</th>
                                    <th className="p-3">Draf Caption</th>
                                </tr>
                            </thead>
                            <tbody>
                            {contentCalendar.map((entry, index) => (
                                <tr key={index} className="border-b border-border-main">
                                    <td className="p-3 font-semibold text-text-header">{entry.hari}</td>
                                    <td className="p-3"><span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{entry.tipe_konten}</span></td>
                                    <td className="p-3">{entry.ide_konten}</td>
                                    <td className="p-3 whitespace-pre-wrap">
                                        <p className="selectable-text">{entry.draf_caption}</p>
                                        <p className="text-accent text-xs mt-2 selectable-text">{entry.hashtag.join(' ')}</p>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {calendarSources && calendarSources.length > 0 && (
                        <div>
                            <h4 className="font-bold text-text-header mb-2">Sumber Inspirasi:</h4>
                            <ul className="list-disc list-inside text-xs text-text-muted space-y-1">
                                {calendarSources.map((source, index) => (
                                    <li key={index}>
                                        <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">
                                            {source.web?.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContentCalendarGenerator;