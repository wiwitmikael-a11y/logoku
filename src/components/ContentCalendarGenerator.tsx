// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateContentCalendar } from '../services/geminiService';
import type { Project, ProjectData, ContentCalendarEntry } from '../types';
import { useUserActions } from '../contexts/UserActionsContext';
import { useUI } from '../contexts/UIContext';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import CopyButton from './common/CopyButton';
import Tooltip from './common/Tooltip';

const CALENDAR_COST = 5;
const XP_REWARD = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => void;
}

const ContentCalendarGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const { deductCredits, addXp } = useUserActions();
  const { setCrossComponentPrompt } = useUI();
  const { brandInputs, selectedPersona } = project.project_data;

  const [calendar, setCalendar] = useState<{ plan: ContentCalendarEntry[], sources: { title: string, uri: string }[] } | null>(project.project_data.contentCalendar);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setCalendar(project.project_data.contentCalendar);
  }, [project]);

  if (!brandInputs || !selectedPersona) {
    return <div className="p-6 bg-surface rounded-2xl text-center"><p>Selesaikan Langkah 1 dulu untuk membuka fitur ini.</p></div>;
  }

  const handleGenerate = async () => {
    if ((await deductCredits(CALENDAR_COST)) === false) return;
    setIsLoading(true); setError(null);
    try {
      const newCalendar = await generateContentCalendar(brandInputs, selectedPersona);
      setCalendar(newCalendar);
      await onUpdateProject({ contentCalendar: newCalendar });
      await addXp(XP_REWARD);
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  };
  
  const handleUseIdeaInStudio = (idea: string) => {
    setCrossComponentPrompt({
        targetTool: 'Studio Foto',
        prompt: `Buat gambar untuk postingan media sosial tentang: "${idea}"`
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-surface rounded-2xl space-y-4">
        <h3 className="text-xl font-bold text-text-header">Perencana Konten Mingguan</h3>
        <p className="text-sm text-text-muted">Buntu mau posting apa? Mang AI bisa bikinin jadwal konten 7 hari ke depan, lengkap dengan ide, caption, dan hashtag. Didukung oleh Google Search untuk ide yang relevan!</p>
        <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading}>
          Buat Jadwal Konten ({CALENDAR_COST} Token, +{XP_REWARD} XP)
        </Button>
      </div>
      
      {error && <ErrorMessage message={error} />}
      {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

      {calendar && (
        <div className="animate-content-fade-in space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendar.plan.map((entry, index) => (
              <div key={index} className="bg-surface rounded-lg p-4 flex flex-col">
                <h4 className="font-bold text-text-header">{entry.day}</h4>
                <p className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full self-start my-2">{entry.contentType}</p>
                <p className="text-sm font-semibold text-text-body">"{entry.idea}"</p>
                <div className="text-xs text-text-muted mt-2 space-y-2 border-t border-border-main pt-2 flex-grow">
                    <p className="italic">{entry.caption}</p>
                    <p className="text-accent">{entry.hashtags}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border-main flex items-center justify-between">
                    <Tooltip text="Gunakan ide ini untuk membuat gambar di Studio Foto AI">
                        <Button onClick={() => handleUseIdeaInStudio(entry.idea)} size="small" variant="secondary">Buat Gambar 📷</Button>
                    </Tooltip>
                    <CopyButton textToCopy={`Ide: ${entry.idea}\n\nCaption: ${entry.caption}\n\nHashtag: ${entry.hashtags}`} />
                </div>
              </div>
            ))}
          </div>
           {calendar.sources.length > 0 && (
                <div className="p-4 bg-surface rounded-lg text-xs">
                    <h5 className="font-bold mb-2 text-text-header">Sumber Informasi (dari Google Search):</h5>
                    <ul className="list-disc list-inside space-y-1">
                        {calendar.sources.map((source, i) => (
                            <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{source.title}</a></li>
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
