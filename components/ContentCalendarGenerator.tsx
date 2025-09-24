

import React, { useState, useCallback } from 'react';
import { generateContentCalendar } from '../services/geminiService';
import { playSound } from '../services/soundService';
import type { ContentCalendarEntry, ProjectData } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Card from './common/Card';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { calendar: ContentCalendarEntry[], sources: any[] }) => void;
}

const ContentCalendarGenerator: React.FC<Props> = ({ projectData, onComplete }) => {
  const [calendar, setCalendar] = useState<ContentCalendarEntry[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!projectData.brandInputs || !projectData.selectedPersona) return;
    setIsLoading(true);
    setError(null);
    setCalendar([]);
    playSound('start');

    try {
      const result = await generateContentCalendar(
        projectData.brandInputs.businessName,
        projectData.selectedPersona
      );
      setCalendar(result.calendar);
      setSources(result.sources);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData]);
  
  const handleContinue = () => {
    onComplete({ calendar, sources });
  };

  const copyToClipboard = (text: string) => {
    playSound('click');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Langkah 4: Rencana Konten Sosmed</h2>
        <p className="text-gray-400">Stop bingung mau posting apa. Biar Mang AI yang bikinin draf kalender konten seminggu, lengkap sama ide, caption, hashtag, dan referensi tren terbaru dari Google.</p>
      </div>

      <div className="self-center">
        <Button onClick={handleSubmit} isLoading={isLoading}>
          Kasih Ide Konten, Please!
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {calendar.length > 0 && (
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold">Draf Kalender Konten Lo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calendar.map((item, index) => (
              <Card key={index} title={`${item.hari} - ${item.tipe_konten}`}>
                 <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-200 text-sm mb-1">Ide Konten:</h4>
                        <p className="text-gray-300 text-sm">{item.ide_konten}</p>
                    </div>
                    <div className="relative border-t border-gray-700 pt-3">
                         <h4 className="font-semibold text-gray-200 text-sm mb-1">Draf Caption:</h4>
                         <p className="text-gray-300 whitespace-pre-wrap text-sm pr-10">{item.draf_caption}</p>
                         <button onClick={() => copyToClipboard(item.draf_caption)} title="Salin caption" className="absolute top-2 right-0 p-1 text-gray-400 hover:text-indigo-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                        </button>
                    </div>
                    <div className="border-t border-gray-700 pt-3">
                        <h4 className="font-semibold text-gray-200 text-sm mb-1">Hashtag:</h4>
                        <p className="text-indigo-300 text-xs break-words">{item.rekomendasi_hashtag.join(' ')}</p>
                    </div>
                 </div>
              </Card>
            ))}
          </div>

          {sources.length > 0 && (
             <div className="mt-4">
                <h4 className="font-semibold text-gray-200 mb-2">Sumber dari Google Search:</h4>
                <div className="flex flex-wrap gap-2">
                    {sources.map((source, i) => source.web && (
                        <a href={source.web.uri} key={i} target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full transition-colors">{source.web.title}</a>
                    ))}
                </div>
             </div>
          )}

          <div className="self-center mt-4">
            <Button onClick={handleContinue}>
              Lanjut ke Media Cetak &rarr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCalendarGenerator;
