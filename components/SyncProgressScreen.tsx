import React, { useState, useEffect, useRef } from 'react';
import type { Project, ProjectData } from '../types';
import { supabase } from '../services/supabaseClient';
import { uploadAndSyncProjectAssets, ProgressUpdate, ProgressStatus } from '../services/storageService';
import { isBase64DataUrl } from '../utils/imageUtils';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { playSound } from '../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface SyncProgressScreenProps {
  project: Project;
  onSyncComplete: () => void;
  onSyncError: (error: Error) => void;
}

const getStatusIcon = (status: ProgressStatus) => {
  switch (status) {
    case 'pending':
      return <span className="text-gray-400">🕒</span>;
    case 'uploading':
      return <Spinner />;
    case 'complete':
      return <span className="text-green-400">✅</span>;
    case 'error':
      return <span className="text-red-400">❌</span>;
    default:
      return null;
  }
};

const defineSyncSteps = (projectData: ProjectData): ProgressUpdate[] => {
    const steps: ProgressUpdate[] = [];
    const pushStep = (key: string, name: string, data: string | undefined) => {
        if (isBase64DataUrl(data)) {
            steps.push({ assetKey: key, assetName: name, status: 'pending' });
        }
    };
    
    pushStep('logo-main', 'Logo Utama', projectData.selectedLogoUrl);
    if (projectData.logoVariations) {
        pushStep('logo-variation-stacked', 'Logo Tumpuk', projectData.logoVariations.stacked);
        pushStep('logo-variation-horizontal', 'Logo Datar', projectData.logoVariations.horizontal);
        pushStep('logo-variation-monochrome', 'Logo Monokrom', projectData.logoVariations.monochrome);
    }
    if (projectData.socialMediaKit) {
        pushStep('social-profile-pic', 'Foto Profil Sosmed', projectData.socialMediaKit.profilePictureUrl);
        pushStep('social-banner', 'Banner Sosmed', projectData.socialMediaKit.bannerUrl);
    }
    pushStep('packaging', 'Desain Kemasan', projectData.selectedPackagingUrl);
    if (projectData.printMediaAssets) {
        pushStep('print-banner', 'Spanduk', projectData.printMediaAssets.bannerUrl);
        pushStep('print-roll-banner', 'Roll Banner', projectData.printMediaAssets.rollBannerUrl);
    }
    projectData.contentCalendar?.forEach((entry, index) => {
        pushStep(`content-image-${index}`, `Visual Konten Hari Ke-${index + 1}`, entry.imageUrl);
    });

    return steps;
};


const SyncProgressScreen: React.FC<SyncProgressScreenProps> = ({ project, onSyncComplete, onSyncError }) => {
    const [steps, setSteps] = useState<ProgressUpdate[]>(() => defineSyncSteps(project.project_data));
    const [logs, setLogs] = useState<string[]>(['Memulai proses sinkronisasi...']);
    const [isFinished, setIsFinished] = useState(false);
    const [finalError, setFinalError] = useState<string | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        const syncProcess = async () => {
            try {
                const onProgress = (update: ProgressUpdate) => {
                    setSteps(prev => prev.map(step => step.assetKey === update.assetKey ? { ...step, ...update } : step));
                    const logMessage = `[${update.assetName}] ${update.message || update.status}`;
                    setLogs(prev => [...prev, logMessage]);
                };
                
                setLogs(prev => [...prev, "Memulai unggahan aset..."]);
                const syncedProjectData = await uploadAndSyncProjectAssets(project, onProgress);
                
                setLogs(prev => [...prev, "Semua aset berhasil diunggah. Menyimpan data final..."]);
                
                const { error: dbError } = await supabase
                    .from('projects')
                    .update({ project_data: syncedProjectData, status: 'completed' as const })
                    .eq('id', project.id);

                if (dbError) throw dbError;

                setLogs(prev => [...prev, "🎉 Sinkronisasi Selesai! Project lo aman di cloud."]);
                playSound('success');
                setIsFinished(true);
            } catch (err) {
                const error = err as Error;
                const errorMessage = `Waduh, gagal di tengah jalan: ${error.message}`;
                setLogs(prev => [...prev, `❌ ERROR: ${errorMessage}`]);
                setFinalError(errorMessage);
                playSound('error');
                setIsFinished(true);
                // onSyncError is called by the parent after this state update causes a re-render and the button press
            }
        };

        const timer = setTimeout(syncProcess, 1000); // Small delay to let UI mount
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once

    const completedSteps = steps.filter(s => s.status === 'complete').length;
    const progressPercent = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
    
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-indigo-400 mb-2">Sinkronisasi Project ke Cloud</h2>
                <p className="text-gray-400">Mang AI lagi mindahin semua aset keren lo ke tempat aman. Sabar ya, Juragan!</p>
            </div>

            <div className="relative p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                 <img
                    src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                    alt="Mang AI working hard"
                    className="animate-mario-top-breathing absolute -top-16 left-1/2 w-32 h-32"
                />

                <div className="w-full bg-gray-700 rounded-full h-4 mb-6 mt-16">
                    <div 
                        className="bg-indigo-600 h-4 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                    {steps.map(step => (
                        <div key={step.assetKey} className="flex items-center gap-3 text-sm">
                            <div className="w-6 text-center flex-shrink-0">{getStatusIcon(step.status)}</div>
                            <span className={step.status === 'error' ? 'text-red-400' : 'text-gray-300'}>{step.assetName}</span>
                            {step.status === 'error' && <span className="text-xs text-red-500 truncate italic">({step.message})</span>}
                        </div>
                    ))}
                </div>

                <div className="bg-gray-900/70 p-4 rounded-lg h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                        {logs.join('\n')}
                    </pre>
                    <div ref={logsEndRef} />
                </div>
            </div>

            {isFinished && (
                <div className="text-center p-6 bg-gray-800 rounded-lg animate-content-fade-in">
                    {finalError ? (
                        <>
                            <h3 className="text-xl font-bold text-red-400 mb-2">Sinkronisasi Gagal</h3>
                            <p className="text-red-200 mb-4">{finalError}</p>
                            <Button onClick={() => onSyncError(new Error(finalError))} variant="secondary">Kembali ke Dashboard</Button>
                        </>
                    ) : (
                         <>
                            <h3 className="text-xl font-bold text-green-400 mb-2">Berhasil Disinkronkan!</h3>
                            <p className="text-green-200 mb-4">Semua aset project lo udah aman tersimpan di cloud.</p>
                            <Button onClick={onSyncComplete}>Kembali ke Dashboard</Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SyncProgressScreen;
