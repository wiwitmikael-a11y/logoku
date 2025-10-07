// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import * as geminiService from '../services/geminiService';
import type { Profile } from '../types';
import LoadingMessage from './common/LoadingMessage';

// --- TYPE DEFINITIONS ---
type Tool = 'select' | 'hand' | 'text'  | 'elements' | 'upload' | 'ai_generate';
type ShapeType = 'rectangle' | 'circle';
type TextAlign = 'left' | 'center' | 'right';
type Panel = 'layers' | 'properties' | 'ai_generate' | 'upload' | 'elements' | 'canvas';
type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'rot' | 'l' | 'r' | 't' | 'b';
type BlendMode = GlobalCompositeOperation;

export interface Shadow { offsetX: number; offsetY: number; blur: number; color: string; }
export interface Filters { brightness: number; contrast: number; saturate: number; grayscale: number; }

export interface BaseLayer { id: number; type: 'text' | 'image' | 'shape'; name: string; x: number; y: number; width: number; height: number; rotation: number; isVisible: boolean; isLocked: boolean; opacity: number; shadow: Shadow; blendMode: BlendMode; }
export interface TextLayer extends BaseLayer { type: 'text'; content: string; font: string; size: number; color: string; textAlign: TextAlign; }
export interface ImageLayer extends BaseLayer { type: 'image'; image: HTMLImageElement; filters: Filters; originalSrc: string; }
export interface ShapeLayer extends BaseLayer { type: 'shape'; shape: ShapeType; fillColor: string; strokeColor: string; strokeWidth: number; }
export type Layer = TextLayer | ImageLayer | ShapeLayer;

export type CanvasState = { layers: Layer[]; backgroundColor: string; width: number; height: number; };
type HistoryState = { past: CanvasState[]; present: CanvasState; future: CanvasState[]; };
type HistoryAction = { type: 'SET_STATE'; newState: Partial<CanvasState>, withHistory?: boolean } | { type: 'UNDO' } | { type: 'REDO' } | { type: 'RESET'; initialState: CanvasState };
type InteractionState = { type: 'move' | 'scale' | 'rotate' | 'pan'; handle?: Handle; initialLayerState?: Layer; initialPoint: { x: number; y: number; }; layerCenter?: { x: number; y: number; }; aspectRatio?: number; } | { type: 'multitouch'; initialDistance: number; initialAngle: number; initialPan: {x: number; y: number}; initialZoom: number; } | null;
type EditingText = { layerId: number; initialContent: string; } | null;

interface SotoshopProps {
  show: boolean;
  onClose: () => void;
}

// --- CONSTANTS, HOOKS, & HELPERS ---
const CANVAS_PRESETS: {[key: string]: {w: number, h: number}} = { 'Instagram Post (1:1)': { w: 1080, h: 1080 }, 'Instagram Story (9:16)': { w: 1080, h: 1920 }, 'Facebook Post (1.91:1)': { w: 1200, h: 630 }, 'Twitter Post (16:9)': { w: 1600, h: 900 } };
const FONT_CATEGORIES = [ { label: "Sans Serif", fonts: ["Poppins", "Montserrat", "Oswald", "Roboto", "Plus Jakarta Sans"] }, { label: "Serif", fonts: ["Playfair Display", "Lora"] }, { label: "Display & Script", fonts: ["Anton", "Bebas Neue", "Lobster", "Pacifico", "Satisfy", "Caveat"] } ];
const BG_REMOVAL_COST = 1, AI_IMAGE_GEN_COST = 1;

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => { const media = window.matchMedia(query); const listener = () => setMatches(media.matches); media.addEventListener('change', listener); return () => media.removeEventListener('change', listener); }, [query]);
  return matches;
};

const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  const { past, present, future } = state;
  switch (action.type) {
    case 'SET_STATE':
      if (action.withHistory === false) return { ...state, present: { ...present, ...action.newState } };
      if (JSON.stringify(present) === JSON.stringify({ ...present, ...action.newState })) return state;
      return { past: [...past, present], present: { ...present, ...action.newState }, future: [] };
    case 'UNDO': if (past.length === 0) return state; return { past: past.slice(0, past.length - 1), present: past[past.length - 1], future: [present, ...future] };
    case 'REDO': if (future.length === 0) return state; return { past: [...past, present], present: future[0], future: future.slice(1) };
    case 'RESET': return { past: [], present: action.initialState, future: [] };
    default: return state;
  }
};

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result as string); reader.onerror = error => reject(error); });

// --- MAIN COMPONENT ---
const Sotoshop: React.FC<SotoshopProps> = ({ show, onClose }) => {
    const { profile } = useAuth();
    const { deductCredits, setShowOutOfCreditsModal, addXp } = useUserActions();
    const initialState: CanvasState = { layers: [], backgroundColor: '#18181b', width: 1080, height: 1080 };
    const [historyState, dispatch] = useReducer(historyReducer, { past: [], present: initialState, future: [] });
    const { layers, backgroundColor, width, height } = historyState.present;
    
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [zoom, setZoom] = useState(0.5);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    const [editingText, setEditingText] = useState<EditingText>(null);
    
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const [activeMobilePanel, setActiveMobilePanel] = useState<Panel | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>('select');

    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const lastPointerPos = useRef({ x: 0, y: 0 });

    const setState = useCallback((newState: Partial<CanvasState>, withHistory = true) => dispatch({ type: 'SET_STATE', newState, withHistory }), []);
    
    const addLayer = useCallback(<T extends Omit<Layer, 'id'>>(layerData: T) => {
        const newLayer = { ...layerData, id: Date.now() } as unknown as Layer;
        setState({ layers: [...historyState.present.layers, newLayer] });
        setSelectedLayerId(newLayer.id);
        setActiveMobilePanel('properties');
    }, [historyState.present.layers, setState]);
    
    const updateLayer = useCallback((id: number, props: Partial<Layer>, withHistory = true) => {
        const newLayers = historyState.present.layers.map(l => l.id === id ? { ...l, ...props } : l);
        setState({ layers: newLayers as Layer[] }, withHistory);
    }, [historyState.present.layers, setState]);
    
    useEffect(() => {
        if (viewportRef.current && show) {
            const { clientWidth, clientHeight } = viewportRef.current;
            const initialZoom = Math.min(clientWidth / (width + 100), clientHeight / (height + 100));
            setZoom(initialZoom);
            setPan({ x: (clientWidth - width * initialZoom) / 2, y: (clientHeight - height * initialZoom) / 2 });
        }
    }, [show, width, height]);


    const handleGenerateAiImage = useCallback(async () => {
        if (!aiPrompt) return;
        if ((profile?.credits ?? 0) < AI_IMAGE_GEN_COST) {
            setShowOutOfCreditsModal(true);
            return;
        }
        setIsGeneratingAiImage(true);
        setError(null);
        playSound('start');
        try {
            if (!(await deductCredits(AI_IMAGE_GEN_COST))) {
                throw new Error("Gagal mengurangi token.");
            }
            const base64 = await geminiService.generateImageForCanvas(aiPrompt);
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const newWidth = Math.min(img.width, width * 0.5);
                const newHeight = newWidth / aspectRatio;
                addLayer({
                    type: 'image',
                    image: img,
                    name: aiPrompt.substring(0, 30),
                    x: (width - newWidth) / 2,
                    y: (height - newHeight) / 2,
                    width: newWidth,
                    height: newHeight,
                    rotation: 0,
                    isVisible: true,
                    isLocked: false,
                    opacity: 1,
                    shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000' },
                    blendMode: 'source-over',
                    filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0 },
                    originalSrc: base64
                });
                playSound('success');
                addXp(10);
                setAiPrompt('');
            };
            img.onerror = () => {
                throw new Error("Gagal memuat gambar yang di-generate AI.");
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat gambar AI.');
            playSound('error');
        } finally {
            setIsGeneratingAiImage(false);
        }
    }, [aiPrompt, profile, deductCredits, setShowOutOfCreditsModal, addLayer, width, height, addXp]);

    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-background z-50 p-1 sm:p-4">
            <div className="w-full h-full bg-surface rounded-lg flex flex-col">
                <header className="p-2 sm:p-4 border-b border-border-main flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold text-primary">Sotoshop Editor</h2>
                    <Button onClick={onClose} variant="secondary" size="small">Tutup</Button>
                </header>
                <main className="flex-grow p-2 sm:p-4 overflow-hidden relative" ref={viewportRef}>
                    <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted">
                        Fungsionalitas Sotoshop sedang dalam perbaikan.
                    </p>
                    <canvas ref={canvasRef} className="shadow-lg absolute" style={{ 
                        left: pan.x, 
                        top: pan.y, 
                        width: width * zoom, 
                        height: height * zoom, 
                        backgroundColor: backgroundColor 
                    }} width={width} height={height} />
                </main>
                <footer className="p-2 sm:p-4 border-t border-border-main flex-shrink-0">
                    {error && <div className="p-2 bg-red-500/10 text-red-400 rounded text-sm">{error}</div>}
                    {isGeneratingAiImage && <div className="p-2"><LoadingMessage /></div>}
                </footer>
            </div>
        </div>
    );
};

export default Sotoshop;
