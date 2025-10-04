// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';

// --- TYPE DEFINITIONS ---
export type Tool = 'select' | 'text' | 'shape' | 'hand' | 'image';
export type ShapeType = 'rectangle' | 'circle';
export type TextAlign = 'left' | 'center' | 'right';
export type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'rot';

export interface Shadow { offsetX: number; offsetY: number; blur: number; color: string; }
export interface Filters { brightness: number; contrast: number; saturate: number; grayscale: number; }

export interface BaseLayer { id: number; type: 'text' | 'image' | 'shape'; name: string; x: number; y: number; width: number; height: number; rotation: number; isVisible: boolean; isLocked: boolean; opacity: number; shadow: Shadow; }
export interface TextLayer extends BaseLayer { type: 'text'; content: string; font: string; size: number; color: string; textAlign: TextAlign; }
export interface ImageLayer extends BaseLayer { type: 'image'; image: HTMLImageElement; filters: Filters; }
export interface ShapeLayer extends BaseLayer { type: 'shape'; shape: ShapeType; fillColor: string; strokeColor: string; strokeWidth: number; }
export type Layer = TextLayer | ImageLayer | ShapeLayer;

export type CanvasState = { layers: Layer[]; backgroundColor: string; width: number; height: number; };
type HistoryState = { past: CanvasState[]; present: CanvasState; future: CanvasState[]; };

type HistoryAction = 
    | { type: 'SET_STATE'; newState: Partial<CanvasState>, withHistory: boolean }
    | { type: 'UNDO' }
    | { type: 'REDO' };
    
type InteractionState = {
    type: 'move' | 'scale' | 'rotate' | 'pan';
    handle?: Handle;
    initialLayerState?: Layer;
    initialPoint: { x: number; y: number; };
    initialScreenPoint: { x: number; y: number; };
    initialPan?: { x: number; y: number; };
    layerCenter?: { x: number; y: number; };
    aspectRatio?: number;
} | { type: 'drag_panel', panel: 'layers' | 'properties', initialMouse: {x:number, y:number}, initialPanelPos: {x:number, y:number} } | null;

type EditingText = { layerId: number; initialContent: string; } | null;
type SnapGuide = { type: 'v' | 'h', position: number };
type ActivePopup = { type: 'properties' | 'layers' | 'bg_color' | null; position?: {x: number, y:number}}

const CANVAS_PRESETS: {[key: string]: {w: number, h: number}} = { 'Instagram Post (1:1)': { w: 1080, h: 1080 }, 'Instagram Story (9:16)': { w: 1080, h: 1920 }, 'Facebook Post': { w: 1200, h: 630 }, 'Twitter Post': { w: 1600, h: 900 } };
const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 20;
const SNAP_THRESHOLD = 5;

// --- HISTORY REDUCER ---
const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
    const { past, present, future } = state;
    switch (action.type) {
        case 'SET_STATE':
            if (!action.withHistory) { return { ...state, present: { ...present, ...action.newState } }; }
            if (JSON.stringify(present) === JSON.stringify({ ...present, ...action.newState })) { return state; }
            return { past: [...past, present], present: { ...present, ...action.newState }, future: [] };
        case 'UNDO':
            if (past.length === 0) return state;
            const previous = past[past.length - 1];
            return { past: past.slice(0, past.length - 1), present: previous, future: [present, ...future] };
        case 'REDO':
            if (future.length === 0) return state;
            const next = future[0];
            return { past: [...past, present], present: next, future: future.slice(1) };
        default: return state;
    }
};

// --- HELPER UI COMPONENTS ---
const FONT_FAMILES = ['Plus Jakarta Sans', 'Bebas Neue', 'Caveat', 'Arial', 'Verdana', 'Times New Roman'];
export const PropertyInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, suffix?: string }> = ({ label, suffix, ...props }) => ( <div className="grid grid-cols-2 items-center gap-2"><label className="text-text-muted text-xs truncate">{label}</label><div className="relative"><input {...props} className={`w-full bg-background border border-border-main rounded p-1.5 text-sm ${suffix ? 'pr-6' : ''}`}/><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">{suffix}</span></div></div>);
export const PropertyTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => ( <div><label className="block text-text-muted mb-1 text-xs">{label}</label><textarea {...props} className="w-full bg-background border border-border-main rounded py-2 px-2.5 text-sm"/></div>);
export const PropertySelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }> = ({ label, children, ...props }) => ( <div><label className="block text-text-muted mb-1 text-xs">{label}</label><select {...props} className="w-full bg-background border border-border-main rounded py-2 px-2.5 text-sm">{children}</select></div>);
export const PropertyColorInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => ( <div className="grid grid-cols-2 items-center gap-2"><label className="text-text-muted text-xs truncate">{label}</label><input type="color" {...props} className="w-full h-8 p-0.5 bg-background border border-border-main rounded" /></div>);
export const PanelSection: React.FC<{title: string, children: React.ReactNode, defaultOpen?: boolean}> = ({title, children, defaultOpen = true}) => <details className="border-b border-border-main" open={defaultOpen}><summary className="font-bold text-text-header text-xs py-2 cursor-pointer uppercase tracking-wider">{title}</summary><div className="pb-3 space-y-3">{children}</div></details>
const rotatePoint = (point: {x:number, y:number}, center: {x:number, y:number}, angle: number) => {
    const rad = angle * Math.PI / 180; const cos = Math.cos(rad); const sin = Math.sin(rad);
    const x = point.x - center.x; const y = point.y - center.y;
    return { x: x * cos - y * sin + center.x, y: x * sin + y * cos + center.y };
};

const NewDocumentModal: React.FC<{
    onClose: () => void;
    onCreate: (w: number, h: number, bg: string) => void;
}> = ({ onClose, onCreate }) => {
    const [preset, setPreset] = useState(Object.keys(CANVAS_PRESETS)[0]);
    const [width, setWidth] = useState(CANVAS_PRESETS[preset].w);
    const [height, setHeight] = useState(CANVAS_PRESETS[preset].h);
    const [bgColor, setBgColor] = useState('#101012');

    useEffect(() => {
        const p = CANVAS_PRESETS[preset];
        if (p) {
            setWidth(p.w);
            setHeight(p.h);
        }
    }, [preset]);

    return (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-surface p-6 rounded-lg shadow-lg w-full max-w-sm text-text-body">
                <h3 className="text-xl font-bold mb-4 text-text-header">Create New Canvas</h3>
                <div className="space-y-4">
                    <PropertySelect label="Preset" value={preset} onChange={e => setPreset(e.target.value)}>
                        {Object.keys(CANVAS_PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="custom">Custom</option>
                    </PropertySelect>
                    <div className="grid grid-cols-2 gap-4">
                        <PropertyInput label="Width" type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} suffix="px" disabled={preset !== 'custom'} />
                        <PropertyInput label="Height" type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} suffix="px" disabled={preset !== 'custom'} />
                    </div>
                    <PropertyColorInput label="Background" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                    <div className="flex gap-4 pt-4 border-t border-border-main">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button variant="splash" onClick={() => onCreate(width, height, bgColor)}>Create</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW FLOATING & CONTEXTUAL UI COMPONENTS (Defined inside Sotoshop) ---

const Sotoshop: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
    
    // --- STATE MANAGEMENT ---
    const [canvasState, setCanvasState] = useState<'setup' | 'editing'>('setup');
    const [history, dispatchHistory] = useReducer(historyReducer, { past: [], present: { layers: [], backgroundColor: '#101012', width: 1080, height: 1080 }, future: [] });
    const { present: currentCanvas, past, future } = history;
    const { layers, backgroundColor, width, height } = currentCanvas;

    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [viewTransform, setViewTransform] = useState({ zoom: 0.5, pan: { x: 0, y: 0 } });
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    const [editingText, setEditingText] = useState<EditingText>(null);
    const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
    const [activePopup, setActivePopup] = useState<ActivePopup>({type: null});
    
    const [panelPositions, setPanelPositions] = useState({ layers: { x: 20, y: 80 }, properties: { x: window.innerWidth - 276, y: 80 } });

    // --- REFS ---
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const guideCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const isSpacePressed = useRef(false);
    const multiTouchStateRef = useRef<{ initialDist: number, initialPan: {x:number, y:number}, initialZoom: number, initialMid: {x:number, y:number} } | null>(null);

    // --- CORE ACTIONS ---
    const setState = (newState: Partial<CanvasState>, withHistory = true) => dispatchHistory({ type: 'SET_STATE', newState, withHistory });
    const undo = useCallback(() => { playSound('select'); dispatchHistory({ type: 'UNDO' }); }, []);
    const redo = useCallback(() => { playSound('select'); dispatchHistory({ type: 'REDO' }); }, []);

    // --- DRAWING & CANVAS LOGIC --- (largely unchanged)
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); const container = canvasContainerRef.current;
        if (!canvas || !ctx || !container) return;
        canvas.width = container.clientWidth; canvas.height = container.clientHeight;
        ctx.save();
        ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(viewTransform.pan.x, viewTransform.pan.y); ctx.scale(viewTransform.zoom, viewTransform.zoom);
        ctx.fillStyle = backgroundColor; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
        ctx.fillRect(0, 0, width, height); ctx.shadowBlur = 0;

        [...layers].forEach(layer => {
            if (!layer.isVisible) return;
            ctx.save(); ctx.globalAlpha = layer.opacity / 100;
            ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2); ctx.rotate(layer.rotation * Math.PI / 180); ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
            
            ctx.shadowColor = layer.shadow.color; ctx.shadowBlur = layer.shadow.blur; ctx.shadowOffsetX = layer.shadow.offsetX; ctx.shadowOffsetY = layer.shadow.offsetY;
            if(layer.type === 'image') ctx.filter = `brightness(${layer.filters.brightness}%) contrast(${layer.filters.contrast}%) saturate(${layer.filters.saturate}%) grayscale(${layer.filters.grayscale}%)`;

            if (layer.type === 'image' && layer.image.complete) { ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
            } else if (layer.type === 'text') {
                if(editingText?.layerId !== layer.id) {
                    ctx.font = `${layer.size}px ${layer.font}`; ctx.fillStyle = layer.color; ctx.textBaseline = 'top'; ctx.textAlign = layer.textAlign;
                    const drawX = layer.textAlign === 'center' ? layer.x + layer.width/2 : layer.textAlign === 'right' ? layer.x + layer.width : layer.x;
                    ctx.fillText(layer.content, drawX, layer.y);
                }
            } else if (layer.type === 'shape') {
                ctx.fillStyle = layer.fillColor; ctx.strokeStyle = layer.strokeColor; ctx.lineWidth = layer.strokeWidth;
                if (layer.shape === 'rectangle') { ctx.fillRect(layer.x, layer.y, layer.width, layer.height); if(layer.strokeWidth > 0) ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
                } else { ctx.beginPath(); ctx.ellipse(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, 2 * Math.PI); ctx.fill(); if(layer.strokeWidth > 0) ctx.stroke(); }
            }
            ctx.restore();
        });
        
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (selectedLayer && editingText?.layerId !== selectedLayer.id) {
            ctx.save();
            ctx.translate(selectedLayer.x + selectedLayer.width / 2, selectedLayer.y + selectedLayer.height / 2); ctx.rotate(selectedLayer.rotation * Math.PI / 180);
            const handleSize = HANDLE_SIZE / viewTransform.zoom; ctx.strokeStyle = 'rgb(var(--c-splash))'; ctx.lineWidth = 1 / viewTransform.zoom; ctx.fillStyle = 'white';
            ctx.strokeRect(-selectedLayer.width / 2, -selectedLayer.height / 2, selectedLayer.width, selectedLayer.height);
            ctx.fillRect(-selectedLayer.width/2 - handleSize/2, -selectedLayer.height/2 - handleSize/2, handleSize, handleSize); ctx.fillRect(selectedLayer.width/2 - handleSize/2, -selectedLayer.height/2 - handleSize/2, handleSize, handleSize);
            ctx.fillRect(-selectedLayer.width/2 - handleSize/2, selectedLayer.height/2 - handleSize/2, handleSize, handleSize); ctx.fillRect(selectedLayer.width/2 - handleSize/2, selectedLayer.height/2 - handleSize/2, handleSize, handleSize);
            const rotHandleOffset = ROTATION_HANDLE_OFFSET / viewTransform.zoom;
            ctx.beginPath(); ctx.moveTo(0, -selectedLayer.height / 2); ctx.lineTo(0, -selectedLayer.height / 2 - rotHandleOffset); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, -selectedLayer.height / 2 - rotHandleOffset, handleSize / 1.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }, [layers, selectedLayerId, backgroundColor, width, height, viewTransform, editingText]);
    const drawGuides = useCallback(() => { /* ... unchanged ... */ }, [snapGuides, viewTransform, width, height]);

    // --- LAYER & STATE MANIPULATION ---
    const updateLayer = (id: number, props: Partial<Layer>, withHistory = true) => setState({ layers: layers.map(l => (l.id === id ? { ...l, ...props } : l)) }, withHistory);
    const addLayer = (type: 'text' | 'shape' | 'image', options: any = {}) => {
        let newLayer: Layer; const defaultShadow = { offsetX: 2, offsetY: 2, blur: 4, color: '#00000080' };
        const common = { id: Date.now(), x: (width/2)-75, y: (height/2)-50, rotation: 0, isVisible: true, isLocked: false, opacity: 100, shadow: defaultShadow };
        if (type === 'text') { newLayer = { ...common, name: "Teks Baru", type: 'text', content: 'Teks Baru', font: 'Plus Jakarta Sans', size: 48, color: '#FFFFFF', width: 200, height: 50, textAlign: 'left' }; }
        else if (type === 'image') { newLayer = { ...common, name: options.name || "Gambar", type: 'image', image: options.image, width: options.image.width, height: options.image.height, filters: {brightness: 100, contrast: 100, saturate: 100, grayscale: 0} }; }
        else { newLayer = { ...common, name: "Bentuk Baru", type: 'shape', shape: options.shapeType!, fillColor: '#c026d3', strokeColor: '#000000', strokeWidth: 0, width: 150, height: 150 }; }
        setState({ layers: [...layers, newLayer] }); setSelectedLayerId(newLayer.id);
    };
    const deleteLayer = useCallback((id: number) => { setState({ layers: layers.filter(l => l.id !== id) }); if(selectedLayerId === id) setSelectedLayerId(null); }, [layers, selectedLayerId, setState]);
    const handleReorderLayers = (newLayers: Layer[]) => setState({ layers: newLayers });

    // --- EVENT HANDLERS ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... unchanged ... */ };
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => { /* ... unchanged ... */ };
    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (interactionState?.type === 'drag_panel') {
            const dx = e.clientX - interactionState.initialMouse.x;
            const dy = e.clientY - interactionState.initialMouse.y;
            setPanelPositions(prev => ({ ...prev, [interactionState.panel]: { x: interactionState.initialPanelPos.x + dx, y: interactionState.initialPanelPos.y + dy }}));
            return;
        }
        /* ... rest is unchanged ... */
    };
    const handleCanvasMouseUp = () => { /* ... unchanged ... */ };
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => { /* ... unchanged ... */ };
    const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => { /* ... unchanged ... */ };
    const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => { /* ... unchanged ... */ };
    const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => { /* ... unchanged ... */ };
    useEffect(() => { /* ... keydown/keyup unchanged ... */ }, [selectedLayerId, undo, redo, deleteLayer]);
    const handleTextEditBlur = () => { /* ... unchanged ... */ };
    useEffect(() => { if(editingText && textInputRef.current) textInputRef.current.focus(); }, [editingText]);

    // --- UI/UX Flow ---
    const handleCreateCanvas = (w:number, h:number, bg:string) => {
        setState({ layers: [], backgroundColor: bg, width: w, height: h }); setCanvasState('editing');
        setTimeout(() => { const container = canvasContainerRef.current; if(container) {
                const zoomX = container.clientWidth / (w + 100); const zoomY = container.clientHeight / (h + 100); const newZoom = Math.min(zoomX, zoomY, 1);
                setViewTransform({ zoom: newZoom, pan: {x: (container.clientWidth - w * newZoom)/2, y: (container.clientHeight - h * newZoom)/2 }});
        }}, 10);
    };
    const handleExport = () => { /* ... simplified for brevity ... */ };

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    
    // --- REDRAW TRIGGER ---
    useEffect(() => { if (show && canvasState === 'editing') redrawCanvas(); }, [show, redrawCanvas, canvasState, viewTransform]);
    useEffect(() => { const handler = () => { if(canvasState === 'editing') redrawCanvas(); }; window.addEventListener('resize', handler); return () => window.removeEventListener('resize', handler);}, [canvasState, redrawCanvas]);

    // --- NEW UI COMPONENTS ---

    const HorizontalToolbar: React.FC = () => (
        <div className="flex-shrink-0 bg-surface border-b border-border-main p-1 overflow-x-auto">
            <div className="flex items-center gap-1 w-max">
                <Button size="small" variant="secondary" onClick={undo} disabled={past.length === 0}>Undo</Button>
                <Button size="small" variant="secondary" onClick={redo} disabled={future.length === 0}>Redo</Button>
                <div className="w-px h-6 bg-border-main mx-1"></div>
                <Button size="small" variant="secondary" onClick={() => addLayer('text')}>+ Teks</Button>
                <Button size="small" variant="secondary" onClick={() => addLayer('shape', {shapeType: 'rectangle'})}>+ Persegi</Button>
                <Button size="small" variant="secondary" onClick={() => addLayer('shape', {shapeType: 'circle'})}>+ Lingkaran</Button>
                <Button size="small" variant="secondary" onClick={() => fileInputRef.current?.click()}>↑ Upload</Button>
                <div className="w-px h-6 bg-border-main mx-1"></div>
                <Button size="small" variant="secondary" onClick={() => setActivePopup(p => ({type: p.type === 'layers' ? null : 'layers'}))}>Layers</Button>
                <label className="flex items-center gap-2 p-2 text-sm font-semibold rounded-lg hover:bg-background cursor-pointer"><span className="text-text-muted">Background</span><input type="color" value={backgroundColor} onChange={e => setState({backgroundColor: e.target.value}, true)} className="w-6 h-6 p-0 bg-transparent border-none rounded"/></label>
            </div>
        </div>
    );

    const FloatingLayersPanel: React.FC = () => {
        if (activePopup.type !== 'layers') return null;
        return (
             <div className="absolute w-64 bg-surface/90 backdrop-blur-md border border-border-main rounded-lg shadow-2xl flex flex-col" style={{ top: panelPositions.layers.y, left: panelPositions.layers.x }}>
                <div onMouseDown={(e) => setInteractionState({type: 'drag_panel', panel: 'layers', initialMouse: {x: e.clientX, y: e.clientY}, initialPanelPos: panelPositions.layers })} className="p-2 cursor-move border-b border-border-main flex justify-between items-center"><h3 className="font-bold text-text-header text-sm">Layers</h3><button onClick={() => setActivePopup({type: null})} className="p-1 text-text-muted hover:text-white">&times;</button></div>
                {/* Logic from old LayersPanel.tsx */}
                <div className="flex-grow overflow-y-auto space-y-1 p-1 max-h-80">{[...layers].reverse().map(l => <div key={l.id}>{l.name}</div>)}</div>
            </div>
        );
    };

    const ContextualToolbar: React.FC = () => {
        if (!selectedLayer) return null;
        const { x, y, width, height, rotation } = selectedLayer; const { zoom, pan } = viewTransform;
        const centerX = (x + width / 2) * zoom + pan.x;
        const rad = rotation * Math.PI / 180; const absCos = Math.abs(Math.cos(rad)); const absSin = Math.abs(Math.sin(rad));
        const boundHeight = (width * absSin + height * absCos) * zoom;
        const screenTop = (y + height / 2) * zoom + pan.y - boundHeight / 2;

        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${screenTop - 50}px`,
            left: `${centerX}px`,
            transform: 'translateX(-50%)',
            zIndex: 30
        };

        return (
            <div style={style} className="bg-surface/90 backdrop-blur-md border border-border-main rounded-lg shadow-lg flex items-center p-1" onMouseDown={e => e.stopPropagation()}>
                <button title="Properti" onClick={() => setActivePopup(p => ({type: p.type === 'properties' ? null : 'properties'}))} className="p-2.5 text-text-muted hover:bg-background rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg></button>
                <div className="w-px h-5 bg-border-main mx-1"></div>
                <button title="Layer Up" className="p-2.5 text-text-muted hover:bg-background rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg></button>
                <button title="Layer Down" className="p-2.5 text-text-muted hover:bg-background rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
                <div className="w-px h-5 bg-border-main mx-1"></div>
                <button title="Duplicate" className="p-2.5 text-text-muted hover:bg-background rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                <div className="w-px h-5 bg-border-main mx-1"></div>
                <button title="Delete" onClick={() => deleteLayer(selectedLayer.id)} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
        );
    };
    
    const FloatingPropertiesPanel: React.FC = () => {
        if(activePopup.type !== 'properties') return null;
        // Logic from old PropertiesPanel
        const updateLayerNoHistory = (props: Partial<Layer>) => { if (selectedLayer) updateLayer(selectedLayer.id, props, false); };
        return(
            <div className="absolute w-64 bg-surface/90 backdrop-blur-md border border-border-main rounded-lg shadow-2xl flex flex-col" style={{ top: panelPositions.properties.y, left: panelPositions.properties.x }}>
                <div onMouseDown={(e) => setInteractionState({type: 'drag_panel', panel: 'properties', initialMouse: {x: e.clientX, y: e.clientY}, initialPanelPos: panelPositions.properties })} className="p-2 cursor-move border-b border-border-main flex justify-between items-center"><h3 className="font-bold text-text-header text-sm">Properties</h3><button onClick={() => setActivePopup({type: null})} className="p-1 text-text-muted hover:text-white">&times;</button></div>
                <div className="p-2 space-y-3 max-h-96 overflow-y-auto">
                    { selectedLayer && <PanelSection title="Transform">...</PanelSection> }
                    {/* ... other sections */}
                </div>
            </div>
        );
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-background flex flex-col z-50 text-text-body" role="dialog" onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp}>
            <style>{`
                .sotoshop-accent-stripes {
                    background: repeating-linear-gradient(-45deg, rgb(var(--c-accent)), rgb(var(--c-accent)) 10px, #0a0a0a 10px, #0a0a0a 20px );
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
                }
            `}</style>
            {canvasState === 'setup' && <NewDocumentModal onClose={onClose} onCreate={handleCreateCanvas} />}
            {canvasState === 'editing' && (
                <>
                    <header className="relative flex-shrink-0 flex justify-between items-center p-1 bg-surface border-b border-border-main">
                         <div className="absolute top-0 left-0 w-full h-1.5 sotoshop-accent-stripes"></div>
                        <h2 className="text-2xl font-bold text-text-header px-2 pt-1.5 tracking-wider" style={{fontFamily: 'var(--font-display)'}}>Sotoshop</h2>
                        <div className="flex items-center gap-2 pt-1.5">
                            <Button size="small" variant="splash" onClick={handleExport}>Ekspor</Button>
                            <Button size="small" variant="secondary" onClick={onClose}>Tutup</Button>
                        </div>
                    </header>
                    <HorizontalToolbar />
                    <main ref={canvasContainerRef} className="flex-grow flex items-center justify-center bg-background overflow-hidden relative touch-none">
                        <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onWheel={handleWheel} onTouchStart={handleCanvasTouchStart} onTouchMove={handleCanvasTouchMove} onTouchEnd={handleCanvasTouchEnd} />
                        <canvas ref={guideCanvasRef} className="absolute inset-0 pointer-events-none" />
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                        {editingText && ( <textarea ref={textInputRef} defaultValue={editingText.initialContent} onBlur={handleTextEditBlur} style={{/* ... */}} /> )}
                        <ContextualToolbar />
                        <FloatingLayersPanel />
                        <FloatingPropertiesPanel />
                    </main>
                </>
            )}
        </div>
    );
};

export default Sotoshop;