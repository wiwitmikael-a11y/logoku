// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import * as geminiService from '../services/geminiService';
import type { Profile } from '../types';
import LoadingMessage from './common/LoadingMessage';

// --- TYPE DEFINITIONS ---
type Tool = 'select' | 'hand' | 'text'  | 'elements' | 'upload' | 'ai_generate';
type ShapeType = 'rectangle' | 'circle';
type TextAlign = 'left' | 'center' | 'right';
type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'rot';
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

type HistoryAction = 
    | { type: 'SET_STATE'; newState: Partial<CanvasState>, withHistory?: boolean }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'RESET'; initialState: CanvasState };
    
type InteractionState = 
    | { type: 'move' | 'scale' | 'rotate' | 'pan'; handle?: Handle; initialLayerState?: Layer; initialPoint: { x: number; y: number; }; layerCenter?: { x: number; y: number; }; aspectRatio?: number; } 
    | { type: 'multitouch'; initialDistance: number; initialAngle: number; initialPan: {x: number; y: number}; initialZoom: number; }
    | null;


type EditingText = { layerId: number; initialContent: string; } | null;
type SnapGuide = { type: 'v' | 'h', position: number };
type Panel = 'layers' | 'properties' | 'ai_generate' | 'upload' | 'elements' | null;

interface SotoshopProps {
  show: boolean;
  onClose: () => void;
  profile: Profile | null;
  deductCredits: (amount: number) => Promise<boolean>;
  setShowOutOfCreditsModal: (show: boolean) => void;
  addXp: (amount: number) => Promise<void>;
}

// --- CONSTANTS & HOOKS ---
const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const CANVAS_PRESETS: {[key: string]: {w: number, h: number}} = { 'Instagram Post (1:1)': { w: 1080, h: 1080 }, 'Instagram Story (9:16)': { w: 1080, h: 1920 }, 'Facebook Post (1.91:1)': { w: 1200, h: 630 }, 'Twitter Post (16:9)': { w: 1600, h: 900 } };
const HANDLE_SIZE = 12, ROTATION_HANDLE_OFFSET = 25, SNAP_THRESHOLD = 5;
const FONT_CATEGORIES = [ { label: "Sans Serif", fonts: ["Poppins", "Montserrat", "Oswald", "Roboto", "Plus Jakarta Sans"] }, { label: "Serif", fonts: ["Playfair Display", "Lora"] }, { label: "Display & Script", fonts: ["Anton", "Bebas Neue", "Lobster", "Pacifico", "Satisfy", "Caveat"] } ];
const BG_REMOVAL_COST = 1;
const AI_IMAGE_GEN_COST = 1;

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

// --- HISTORY REDUCER ---
const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  const { past, present, future } = state;
  switch (action.type) {
    case 'SET_STATE':
      if (action.withHistory === false) return { ...state, present: { ...present, ...action.newState } };
      if (JSON.stringify(present) === JSON.stringify({ ...present, ...action.newState })) return state;
      return { past: [...past, present], present: { ...present, ...action.newState }, future: [] };
    case 'UNDO':
      if (past.length === 0) return state;
      return { past: past.slice(0, past.length - 1), present: past[past.length - 1], future: [present, ...future] };
    case 'REDO':
      if (future.length === 0) return state;
      return { past: [...past, present], present: future[0], future: future.slice(1) };
    case 'RESET': return { past: [], present: action.initialState, future: [] };
    default: return state;
  }
};

// --- HELPER UI & FUNCTIONS ---
const PropertyInput: React.FC<({ as?: 'input' } & React.InputHTMLAttributes<HTMLInputElement> | { as: 'select' } & React.SelectHTMLAttributes<HTMLSelectElement>) & { label: string, suffix?: string }> = ({ label, suffix, as = 'input', ...props }) => {
    const commonClasses = "w-full bg-background border border-border-main rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-splash";
    
    return (
        <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-text-muted text-xs truncate">{label}</label>
            <div className="relative">
                {as === 'select' ? (
                    <select {...props as React.SelectHTMLAttributes<HTMLSelectElement>} className={commonClasses}>
                        {props.children}
                    </select>
                ) : (
                    <>
                        <input {...props as React.InputHTMLAttributes<HTMLInputElement>} className={`${commonClasses} ${suffix ? 'pr-6' : ''}`} />
                        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">{suffix}</span>}
                    </>
                )}
            </div>
        </div>
    );
};
const PanelSection: React.FC<{title: string, children: React.ReactNode, defaultOpen?: boolean}> = ({title, children, defaultOpen = true}) => <details className="border-b border-border-main last:border-b-0" open={defaultOpen}><summary className="font-bold text-text-header text-xs py-2 cursor-pointer uppercase tracking-wider" style={{fontFamily: 'var(--font-display)'}}>{title}</summary><div className="pb-3 space-y-3">{children}</div></details>
const rotatePoint = (point: {x:number, y:number}, center: {x:number, y:number}, angle: number) => { const rad = angle * Math.PI / 180; const cos = Math.cos(rad); const sin = Math.sin(rad); return { x: (cos * (point.x - center.x)) - (sin * (point.y - center.y)) + center.x, y: (sin * (point.x - center.x)) + (cos * (point.y - center.y)) + center.y }; };
const deg = (p1: {x:number, y:number}, p2: {x:number, y:number}) => Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result as string); reader.onerror = error => reject(error); });

// --- MAIN COMPONENT ---
const Sotoshop: React.FC<SotoshopProps> = ({ show, onClose, profile, deductCredits, setShowOutOfCreditsModal, addXp }) => {
    const initialState: CanvasState = { layers: [], backgroundColor: '#18181b', width: 1080, height: 1080 };
    const [historyState, dispatch] = useReducer(historyReducer, { past: [], present: initialState, future: [] });
    const { layers, backgroundColor, width, height } = historyState.present;
    
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [zoom, setZoom] = useState(0.5);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    const [editingText, setEditingText] = useState<EditingText>(null);
    const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
    
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [activeMobilePanel, setActiveMobilePanel] = useState<Panel>(null);
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
    
    // --- DRAWING LOGIC ---
    const drawCanvasContent = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, layersToDraw: Layer[], bgColor: string) => {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        for (const layer of layersToDraw) {
            if (!layer.isVisible) continue;
            ctx.save();
            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.blendMode;
            ctx.filter = `drop-shadow(${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color})`;

            if (layer.type === 'image') {
                ctx.filter += ` brightness(${layer.filters.brightness}%) contrast(${layer.filters.contrast}%) saturate(${layer.filters.saturate}%) grayscale(${layer.filters.grayscale}%)`;
            }
            
            const centerX = layer.x + layer.width / 2;
            const centerY = layer.y + layer.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
            
            switch (layer.type) {
                case 'image': ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height); break;
                case 'text':
                    ctx.font = `${layer.size}px ${layer.font}`;
                    ctx.fillStyle = layer.color;
                    ctx.textAlign = layer.textAlign;
                    ctx.textBaseline = 'top';
                    let textX = layer.x;
                    if (layer.textAlign === 'center') textX += layer.width / 2;
                    if (layer.textAlign === 'right') textX += layer.width;
                    // Simple word wrap
                    const words = layer.content.split(' ');
                    let line = '';
                    let testY = layer.y;
                    for(let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + ' ';
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > layer.width && n > 0) {
                            ctx.fillText(line, textX, testY);
                            line = words[n] + ' ';
                            testY += layer.size * 1.2; // Line height
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line, textX, testY);
                    break;
                case 'shape':
                    ctx.fillStyle = layer.fillColor;
                    ctx.strokeStyle = layer.strokeColor;
                    ctx.lineWidth = layer.strokeWidth;
                    if (layer.shape === 'rectangle') {
                        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
                        if (layer.strokeWidth > 0) ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
                    } else {
                        ctx.beginPath();
                        ctx.arc(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, 0, 2 * Math.PI);
                        ctx.fill();
                        if (layer.strokeWidth > 0) ctx.stroke();
                    }
                    break;
            }
            ctx.restore();
        }
    }, []);

    const redrawCanvas = useCallback(() => { 
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);
        
        drawCanvasContent(ctx, width, height, layers, backgroundColor);

        ctx.restore();
     }, [drawCanvasContent, layers, backgroundColor, width, height, zoom, pan]);

    useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

    // --- INTERACTION & AI FUNCTIONS ---
    const handleGenerateAiImage = useCallback(async () => { if (!aiPrompt) return; if ((profile?.credits ?? 0) < AI_IMAGE_GEN_COST) { setShowOutOfCreditsModal(true); return; } setIsGeneratingAiImage(true); setError(null); playSound('start'); try { if (!(await deductCredits(AI_IMAGE_GEN_COST))) throw new Error("Gagal mengurangi token."); const base64 = await geminiService.generateImageForCanvas(aiPrompt); const img = new Image(); img.src = base64; img.onload = () => { const aspectRatio = img.width / img.height; const newWidth = Math.min(img.width, width * 0.5); addLayer({ type: 'image', image: img, name: aiPrompt.substring(0, 20), x: (width - newWidth)/2, y: (height - newWidth / aspectRatio)/2, width: newWidth, height: newWidth / aspectRatio, rotation: 0, isVisible: true, isLocked: false, opacity: 1, shadow: {offsetX: 0, offsetY: 0, blur: 0, color: '#000000'}, blendMode: 'source-over', filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0 }, originalSrc: base64 }); playSound('success'); addXp(15); }; } catch(err) { setError(err instanceof Error ? err.message : "Gagal membuat gambar AI."); playSound('error'); } finally { setIsGeneratingAiImage(false); } }, [aiPrompt, profile, deductCredits, setShowOutOfCreditsModal, addLayer, addXp, width, height]);
    const handleRemoveBackground = useCallback(async () => { const layer = layers.find(l => l.id === selectedLayerId); if (!layer || layer.type !== 'image') return; if ((profile?.credits ?? 0) < BG_REMOVAL_COST) { setShowOutOfCreditsModal(true); return; } setIsRemovingBg(true); setError(null); playSound('start'); try { if (!(await deductCredits(BG_REMOVAL_COST))) throw new Error("Gagal mengurangi token."); const base64 = await geminiService.removeImageBackground(layer.originalSrc); const img = new Image(); img.src = base64; img.onload = () => { updateLayer(layer.id, { image: img, originalSrc: base64 }); playSound('success'); addXp(10); }; } catch(err) { setError(err instanceof Error ? err.message : "Gagal hapus background."); playSound('error'); } finally { setIsRemovingBg(false); } }, [selectedLayerId, layers, profile, deductCredits, setShowOutOfCreditsModal, updateLayer, addXp]);
    const handleExport = useCallback(async () => { playSound('success'); const exportCanvas = document.createElement('canvas'); exportCanvas.width = width; exportCanvas.height = height; const ctx = exportCanvas.getContext('2d'); if (!ctx) return; const imageLayers = layers.filter(l => l.type === 'image') as ImageLayer[]; const imagePromises = imageLayers.map(l => new Promise<void>(resolve => { if (l.image.complete) resolve(); else l.image.onload = () => resolve(); })); await Promise.all(imagePromises); drawCanvasContent(ctx, width, height, layers, backgroundColor); const link = document.createElement('a'); link.download = `desainfun-sotoshop-${Date.now()}.png`; link.href = exportCanvas.toDataURL('image/png'); link.click(); }, [width, height, layers, backgroundColor, drawCanvasContent]);

    if (!show) return null;
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    
    // --- RENDER LOGIC ---
    const renderPropertiesPanel = (isModal: boolean) => (
        <div className={`p-3 space-y-4 ${isModal ? '' : 'flex-grow overflow-y-auto'}`}>
            {!selectedLayer ? 
                <PanelSection title="Kanvas">
                    <PropertyInput label="Preset" as="select" value={`${width}x${height}`} onChange={e => { const [w,h] = e.target.value.split('x').map(Number); setState({ width: w, height: h }); }}>{Object.entries(CANVAS_PRESETS).map(([name, dim]) => <option key={name} value={`${dim.w}x${dim.h}`}>{name}</option>)}</PropertyInput>
                    <div className="grid grid-cols-2 gap-2"><PropertyInput label="Lebar" type="number" value={width} onChange={e => setState({ width: +e.target.value })} suffix="px"/><PropertyInput label="Tinggi" type="number" value={height} onChange={e => setState({ height: +e.target.value })} suffix="px"/></div>
                    <PropertyInput label="Warna Latar" type="color" value={backgroundColor} onChange={e => setState({ backgroundColor: e.target.value })} />
                </PanelSection>
                : <>
                <PanelSection title="Transform">
                    <div className="grid grid-cols-2 gap-2"><PropertyInput label="X" type="number" value={Math.round(selectedLayer.x)} onChange={e => updateLayer(selectedLayerId!, {x: +e.target.value})} suffix="px"/><PropertyInput label="Y" type="number" value={Math.round(selectedLayer.y)} onChange={e => updateLayer(selectedLayerId!, {y: +e.target.value})} suffix="px"/></div>
                    <div className="grid grid-cols-2 gap-2"><PropertyInput label="Lebar" type="number" value={Math.round(selectedLayer.width)} onChange={e => updateLayer(selectedLayerId!, {width: +e.target.value})} suffix="px"/><PropertyInput label="Tinggi" type="number" value={Math.round(selectedLayer.height)} onChange={e => updateLayer(selectedLayerId!, {height: +e.target.value})} suffix="px"/></div>
                    <PropertyInput label="Rotasi" type="number" value={Math.round(selectedLayer.rotation)} onChange={e => updateLayer(selectedLayerId!, {rotation: +e.target.value})} suffix="°"/>
                </PanelSection>
                {selectedLayer.type === 'text' && <PanelSection title="Text">
                    <div className="grid grid-cols-2 gap-2"><PropertyInput label="Ukuran" type="number" value={selectedLayer.size} onChange={e => updateLayer(selectedLayerId!, {size: +e.target.value})} suffix="px"/><PropertyInput label="Warna" type="color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayerId!, {color: e.target.value})} /></div>
                    <PropertyInput label="Font" as="select" value={selectedLayer.font} onChange={e => updateLayer(selectedLayerId!, {font: e.target.value})}>{FONT_CATEGORIES.map(c => <optgroup label={c.label} key={c.label}>{c.fonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>)}</PropertyInput>
                    <PropertyInput label="Perataan" as="select" value={selectedLayer.textAlign} onChange={e => updateLayer(selectedLayerId!, {textAlign: e.target.value as TextAlign})}><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></PropertyInput>
                </PanelSection>}
                {selectedLayer.type === 'image' && <PanelSection title="Image Tools"><Button onClick={handleRemoveBackground} isLoading={isRemovingBg} size="small" variant="secondary">Hapus Background ({BG_REMOVAL_COST} Token)</Button></PanelSection>}
                <PanelSection title="Tampilan">
                    <PropertyInput label="Opacity" type="range" min="0" max="1" step="0.01" value={selectedLayer.opacity} onChange={e => updateLayer(selectedLayerId!, {opacity: +e.target.value}, false)} suffix={`${Math.round(selectedLayer.opacity*100)}%`}/>
                </PanelSection>
                <PanelSection title="Bayangan">
                     <div className="grid grid-cols-2 gap-2"><PropertyInput label="Offset X" type="range" min="-20" max="20" value={selectedLayer.shadow.offsetX} onChange={e => updateLayer(selectedLayerId!, {shadow: {...selectedLayer.shadow, offsetX: +e.target.value}})} suffix="px"/><PropertyInput label="Offset Y" type="range" min="-20" max="20" value={selectedLayer.shadow.offsetY} onChange={e => updateLayer(selectedLayerId!, {shadow: {...selectedLayer.shadow, offsetY: +e.target.value}})} suffix="px"/></div>
                     <PropertyInput label="Blur" type="range" min="0" max="40" value={selectedLayer.shadow.blur} onChange={e => updateLayer(selectedLayerId!, {shadow: {...selectedLayer.shadow, blur: +e.target.value}})} suffix="px"/>
                     <PropertyInput label="Warna" type="color" value={selectedLayer.shadow.color} onChange={e => updateLayer(selectedLayerId!, {shadow: {...selectedLayer.shadow, color: e.target.value}})}/>
                </PanelSection>
            </>}
        </div>
    );

    const renderLayersPanel = (isModal: boolean) => (
        <div className={`p-3 space-y-2 ${isModal ? '' : 'flex-grow overflow-y-auto'}`}>
            {layers.slice().reverse().map(layer => (
                 <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${selectedLayerId === layer.id ? 'bg-splash/20' : 'hover:bg-background'}`}>
                    <span className="flex-grow truncate text-xs">{layer.name}</span>
                    <button onClick={e => {e.stopPropagation(); updateLayer(layer.id, { isVisible: !layer.isVisible })}} className="text-text-muted hover:text-white">{layer.isVisible ? '👁️' : '🙈'}</button>
                    <button onClick={e => {e.stopPropagation(); updateLayer(layer.id, { isLocked: !layer.isLocked })}} className="text-text-muted hover:text-white">{layer.isLocked ? '🔒' : '🔓'}</button>
                 </div>
            ))}
        </div>
    );
    
    const renderPanelModal = (panel: Panel) => (
        <div className="absolute inset-0 bg-surface z-20 flex flex-col animate-content-fade-in">
            <header className="p-2 border-b border-border-main flex justify-between items-center">
                <h3 className="font-bold text-lg text-text-header capitalize">{panel?.replace('_', ' ')}</h3>
                <Button size="small" variant="secondary" onClick={() => setActiveMobilePanel(null)}>Selesai</Button>
            </header>
            <div className="flex-grow overflow-y-auto">
                {panel === 'layers' && renderLayersPanel(true)}
                {panel === 'properties' && renderPropertiesPanel(true)}
                {panel === 'ai_generate' && <div className="p-4 space-y-3"><p className="text-xs text-text-muted">Jelaskan gambar yang ingin kamu buat.</p><textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-background p-2 rounded-md" rows={4} placeholder="cth: seekor kucing astronot mengendarai skateboard..."/><Button onClick={handleGenerateAiImage} isLoading={isGeneratingAiImage}>Generate ({AI_IMAGE_GEN_COST} Token, +15 XP)</Button>{error && <p className="text-xs text-red-400">{error}</p>}</div>}
                {panel === 'upload' && <div className="p-4"><input type="file" accept="image/png, image/jpeg" ref={fileInputRef} className="hidden" onChange={e => { const file = e.target.files?.[0]; if(file) { fileToBase64(file).then(base64 => { const img = new Image(); img.src=base64; img.onload = () => addLayer({ type:'image', image:img, name:file.name, x:50,y:50,width:img.width, height:img.height, rotation:0, isVisible:true, isLocked:false, opacity:1, shadow:{offsetX:0,offsetY:0,blur:0,color:'#000000'}, blendMode:'source-over', filters:{brightness:100,contrast:100,saturate:100,grayscale:0}, originalSrc: base64 }) }); setActiveMobilePanel(null); } }} /><Button onClick={() => fileInputRef.current?.click()}>Pilih Gambar</Button></div>}
                {panel === 'elements' && <div className="p-4 text-text-muted text-sm">Segera hadir!</div>}
            </div>
        </div>
    );

    return (
      <div className="fixed inset-0 bg-background flex flex-col z-50 text-text-body" style={{ touchAction: 'none' }}>
        {/* Header */}
        <header className="flex-shrink-0 flex justify-between items-center p-2 bg-surface border-b border-border-main text-xs">
          <Button size="small" variant="secondary" onClick={onClose}>&larr; Keluar</Button>
          <div className="text-center">
            <p className="font-bold text-text-header text-lg" style={{fontFamily: 'var(--font-display)', letterSpacing: '0.1em'}}>Sotoshop</p>
            <div className="text-xs text-text-muted flex items-center gap-1.5 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-splash" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                <span className="font-bold text-base text-text-header">{profile?.credits ?? 0}</span>
            </div>
          </div>
          <Button size="small" variant="splash" onClick={handleExport}>Export</Button>
        </header>
  
        <main className="flex-grow flex relative overflow-hidden">
             {/* Viewport */}
            <div ref={viewportRef} className="flex-grow flex items-center justify-center bg-background" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='transparent'/%3E%3Ccircle cx='8' cy='8' r='0.5' fill='rgb(var(--c-border))'/%3E%3C/svg%3E")`}}>
                <canvas ref={canvasRef} className="rounded-sm shadow-2xl" />
            </div>
            
            {/* Desktop Panels */}
            {isDesktop && <aside className="w-72 flex-shrink-0 bg-surface border-l border-border-main flex flex-col text-sm"><header className="p-2 border-b border-border-main"><h3 className="font-bold text-text-header">Panel</h3></header>{renderLayersPanel(false)}{renderPropertiesPanel(false)}</aside>}

            {/* Mobile Panels & Toolbar */}
            {!isDesktop && (
                <>
                    {activeMobilePanel && renderPanelModal(activeMobilePanel)}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/80 backdrop-blur-md border border-border-main p-2 rounded-full shadow-lg">
                        <button title="Layers" onClick={() => setActiveMobilePanel('layers')} className="w-12 h-12 flex items-center justify-center rounded-full bg-background/50 hover:bg-border-light text-text-muted"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                        <button title="Properties" onClick={() => selectedLayerId && setActiveMobilePanel('properties')} className="w-12 h-12 flex items-center justify-center rounded-full bg-background/50 hover:bg-border-light text-text-muted disabled:opacity-50" disabled={!selectedLayerId}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></button>
                        <button title="Tambah Teks" onClick={() => addLayer({ type: 'text', content: 'Teks Baru', x: 50, y: 50, width: 200, height: 50, font: 'Poppins', size: 48, color: '#FFFFFF', textAlign: 'left', name: 'Teks Baru', rotation: 0, isVisible: true, isLocked: false, opacity: 1, shadow: {offsetX: 0, offsetY: 0, blur: 0, color: '#000000'}, blendMode: 'source-over' })} className="w-12 h-12 flex items-center justify-center rounded-full bg-background/50 hover:bg-border-light text-text-muted"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v18M6.6 14h5.8M6.4 7.5h6.2" /></svg></button>
                        <button title="Generate AI" onClick={() => setActiveMobilePanel('ai_generate')} className="w-12 h-12 flex items-center justify-center rounded-full bg-splash text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg></button>
                    </div>
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                         <Button size="small" variant="secondary" onClick={() => dispatch({ type: 'UNDO' })} disabled={historyState.past.length === 0}>Undo</Button>
                         <Button size="small" variant="secondary" onClick={() => dispatch({ type: 'REDO' })} disabled={historyState.future.length === 0}>Redo</Button>
                    </div>
                </>
            )}
        </main>
      </div>
    );
};

export default Sotoshop;
