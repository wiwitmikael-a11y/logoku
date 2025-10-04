// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';
import QuickActionsToolbar from './common/QuickActionsToolbar';
import PropertiesPanel from './common/PropertiesPanel';
import LayersPanel from './common/LayersPanel'; // NEW

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
    initialPoint: { x: number; y: number; }; // in world coordinates for layer interactions
    initialScreenPoint: { x: number; y: number; }; // in screen coordinates for panning
    initialPan?: { x: number; y: number; };
    layerCenter?: { x: number; y: number; };
    aspectRatio?: number;
} | null;

type EditingText = { layerId: number; initialContent: string; } | null;
type SnapGuide = { type: 'v' | 'h', position: number };

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

// --- HELPER MATH & UI ---
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

// --- NEW DOCUMENT MODAL ---
const NewDocumentModal: React.FC<{onClose: () => void, onCreate: (w:number, h:number, bg:string) => void}> = ({onClose, onCreate}) => {
    const [presetKey, setPresetKey] = useState('Instagram Post (1:1)');
    const [dims, setDims] = useState(CANVAS_PRESETS['Instagram Post (1:1)']);
    const [bgColor, setBgColor] = useState('#101012');

    const handlePresetChange = (key: string) => {
        setPresetKey(key);
        setDims(CANVAS_PRESETS[key]);
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="m-auto flex flex-col items-center gap-6 p-8 bg-surface rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-splash" style={{ fontFamily: 'var(--font-hand)' }}>Buat Dokumen Baru</h2>
                <div className="w-full space-y-4">
                    <PropertySelect label="Preset Ukuran" value={presetKey} onChange={e => handlePresetChange(e.target.value)}>
                        {Object.keys(CANVAS_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                    </PropertySelect>
                    <div className="grid grid-cols-2 gap-4">
                        <PropertyInput label="Lebar" type="number" value={dims.w} onChange={e => setDims({ ...dims, w: +e.target.value })} suffix="px" />
                        <PropertyInput label="Tinggi" type="number" value={dims.h} onChange={e => setDims({ ...dims, h: +e.target.value })} suffix="px" />
                    </div>
                    <PropertyColorInput label="Warna Background" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button variant="splash" onClick={() => onCreate(dims.w, dims.h, bgColor)}>Buat Kanvas</Button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const Sotoshop: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const guideCanvasRef = useRef<HTMLCanvasElement>(null); // For snap guides
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    
    const [canvasState, setCanvasState] = useState<'setup' | 'editing'>('setup');

    const [history, dispatchHistory] = useReducer(historyReducer, { past: [], present: { layers: [], backgroundColor: '#101012', width: 1080, height: 1080 }, future: [] });
    const { present: currentCanvas, past, future } = history;
    const { layers, backgroundColor, width, height } = currentCanvas;

    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>('select');
    
    const [viewTransform, setViewTransform] = useState({ zoom: 0.5, pan: { x: 0, y: 0 } });
    const isSpacePressed = useRef(false);
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    const multiTouchStateRef = useRef<{ initialDist: number, initialPan: {x:number, y:number}, initialZoom: number, initialMid: {x:number, y:number} } | null>(null);
    const [editingText, setEditingText] = useState<EditingText>(null);
    const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

    const setState = (newState: Partial<CanvasState>, withHistory = true) => dispatchHistory({ type: 'SET_STATE', newState, withHistory });
    const undo = useCallback(() => { playSound('select'); dispatchHistory({ type: 'UNDO' }); }, []);
    const redo = useCallback(() => { playSound('select'); dispatchHistory({ type: 'REDO' }); }, []);
    
    // --- DRAWING LOGIC ---
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

    const drawGuides = useCallback(() => {
        const canvas = guideCanvasRef.current; const ctx = canvas?.getContext('2d'); const container = canvasContainerRef.current;
        if (!canvas || !ctx || !container) return;
        canvas.width = container.clientWidth; canvas.height = container.clientHeight;
        ctx.save(); ctx.translate(viewTransform.pan.x, viewTransform.pan.y); ctx.scale(viewTransform.zoom, viewTransform.zoom);
        ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 1 / viewTransform.zoom;
        snapGuides.forEach(guide => {
            ctx.beginPath();
            if (guide.type === 'v') { ctx.moveTo(guide.position, 0); ctx.lineTo(guide.position, height); }
            else { ctx.moveTo(0, guide.position); ctx.lineTo(width, guide.position); }
            ctx.stroke();
        });
        ctx.restore();
    }, [snapGuides, viewTransform, width, height]);
    
    useEffect(() => { if (show && canvasState === 'editing') { redrawCanvas(); drawGuides(); } }, [show, redrawCanvas, drawGuides, canvasState]);
    useEffect(() => { const handler = () => { if(canvasState === 'editing') { redrawCanvas(); drawGuides(); }}; window.addEventListener('resize', handler); return () => window.removeEventListener('resize', handler);}, [canvasState, redrawCanvas, drawGuides]);

    const updateLayer = (id: number, props: Partial<Layer>, withHistory = true) => setState({ layers: layers.map(l => (l.id === id ? { ...l, ...props } : l)) }, withHistory);
    const addLayer = (type: 'text' | 'shape' | 'image', options: any = {}) => {
        let newLayer: Layer; 
        const defaultShadow = { offsetX: 2, offsetY: 2, blur: 4, color: '#00000080' };
        const common = { id: Date.now(), x: (width/2)-75, y: (height/2)-50, rotation: 0, isVisible: true, isLocked: false, opacity: 100, shadow: defaultShadow };
        if (type === 'text') { newLayer = { ...common, name: "Teks Baru", type: 'text', content: 'Teks Baru', font: 'Plus Jakarta Sans', size: 48, color: '#FFFFFF', width: 200, height: 50, textAlign: 'left' }; }
        else if (type === 'image') { newLayer = { ...common, name: options.name || "Gambar", type: 'image', image: options.image, width: options.image.width, height: options.image.height, filters: {brightness: 100, contrast: 100, saturate: 100, grayscale: 0} }; }
        else { newLayer = { ...common, name: "Bentuk Baru", type: 'shape', shape: options.shapeType!, fillColor: '#c026d3', strokeColor: '#000000', strokeWidth: 0, width: 150, height: 150 }; }
        setState({ layers: [...layers, newLayer] }); setSelectedLayerId(newLayer.id);
    };
    const deleteLayer = useCallback((id: number) => { setState({ layers: layers.filter(l => l.id !== id) }); if(selectedLayerId === id) setSelectedLayerId(null); }, [layers, selectedLayerId, setState]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
        reader.onload = (event) => { const img = new Image(); img.onload = () => addLayer('image', { image: img, name: file.name }); img.src = event.target?.result as string; };
        reader.readAsDataURL(file); e.target.value = ''; // Reset input
    };
    
    const screenToWorld = useCallback((screenX: number, screenY: number) => ({ x: (screenX - viewTransform.pan.x) / viewTransform.zoom, y: (screenY - viewTransform.pan.y) / viewTransform.zoom }), [viewTransform]);
    const getHandleAtPoint = useCallback((point: {x:number, y:number}, layer: Layer): Handle | null => {
        const { x, y, width, height, rotation } = layer; const center = { x: x + width/2, y: y + height/2 };
        const handleSize = HANDLE_SIZE / viewTransform.zoom; const rotHandleOffset = ROTATION_HANDLE_OFFSET / viewTransform.zoom;
        const handles = {
            tl: { x: x, y: y }, tr: { x: x + width, y: y }, bl: { x: x, y: y + height }, br: { x: x + width, y: y + height },
            rot: { x: center.x, y: y - rotHandleOffset }
        };
        for(const [key, handlePos] of Object.entries(handles)) {
            const rotatedHandle = rotatePoint(handlePos, center, rotation);
            if (Math.abs(point.x - rotatedHandle.x) < handleSize && Math.abs(point.y - rotatedHandle.y) < handleSize) return key as Handle;
        }
        return null;
    }, [viewTransform.zoom]);
    const isPointInLayer = (point: {x:number, y:number}, layer: Layer) => {
        const center = { x: layer.x + layer.width/2, y: layer.y + layer.height/2 }; const localPoint = rotatePoint(point, center, -layer.rotation);
        return localPoint.x >= layer.x && localPoint.x <= layer.x + layer.width && localPoint.y >= layer.y && localPoint.y <= layer.y + layer.height;
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if(editingText) return; const { offsetX: screenX, offsetY: screenY } = e.nativeEvent; const worldPoint = screenToWorld(screenX, screenY);
        if (isSpacePressed.current || activeTool === 'hand') { setInteractionState({ type: 'pan', initialPoint: worldPoint, initialScreenPoint: {x: screenX, y: screenY}, initialPan: viewTransform.pan }); return; }
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (selectedLayer && !selectedLayer.isLocked) {
            const handle = getHandleAtPoint(worldPoint, selectedLayer);
            if (handle) {
                const type = handle === 'rot' ? 'rotate' : 'scale';
                setInteractionState({ type, handle, initialLayerState: selectedLayer, initialPoint: worldPoint, initialScreenPoint: {x: screenX, y: screenY}, layerCenter: {x: selectedLayer.x + selectedLayer.width/2, y: selectedLayer.y + selectedLayer.height/2}, aspectRatio: selectedLayer.width / selectedLayer.height });
                return;
            }
        }
        for (const layer of [...layers].reverse()) {
            if (isPointInLayer(worldPoint, layer) && !layer.isLocked) {
                if (layer.id === selectedLayerId && e.detail === 2 && layer.type === 'text') { setEditingText({ layerId: layer.id, initialContent: layer.content }); return; }
                setSelectedLayerId(layer.id);
                setInteractionState({ type: 'move', initialLayerState: layer, initialPoint: worldPoint, initialScreenPoint: {x: screenX, y: screenY} });
                return;
            }
        }
        setSelectedLayerId(null);
    };
    
    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!interactionState) return;
        const { offsetX: screenX, offsetY: screenY } = e.nativeEvent; const worldPoint = screenToWorld(screenX, screenY);
        const dx = worldPoint.x - interactionState.initialPoint.x; const dy = worldPoint.y - interactionState.initialPoint.y;
        if (interactionState.type === 'pan') { setViewTransform(v => ({...v, pan: { x: interactionState.initialPan!.x + (screenX - interactionState.initialScreenPoint.x), y: interactionState.initialPan!.y + (screenY - interactionState.initialScreenPoint.y) }})); return; }

        let activeLayer = layers.find(l => l.id === interactionState.initialLayerState!.id)!;
        let newProps: Partial<Layer> = {};
        
        switch (interactionState.type) {
            case 'move': newProps = { x: interactionState.initialLayerState!.x + dx, y: interactionState.initialLayerState!.y + dy }; break;
            case 'rotate': const angle = Math.atan2(worldPoint.y - interactionState.layerCenter!.y, worldPoint.x - interactionState.layerCenter!.x) * 180 / Math.PI + 90; newProps = { rotation: angle }; break;
            case 'scale':
                const { initialLayerState: initial, layerCenter, handle, aspectRatio } = interactionState;
                if (!initial || !layerCenter || !handle || !aspectRatio) break;
                const localMouse = rotatePoint(worldPoint, layerCenter, -initial.rotation);
                let newWidth = initial.width, newHeight = initial.height, newX = initial.x;
                if (handle.includes('r')) newWidth = localMouse.x - initial.x; else if (handle.includes('l')) newWidth = (initial.x + initial.width) - localMouse.x;
                newWidth = Math.max(newWidth, 10); newHeight = newWidth / aspectRatio;
                newX = handle.includes('l') ? (initial.x + initial.width) - newWidth : initial.x;
                let newY = handle.includes('t') ? (initial.y + initial.height) - newHeight : initial.y;
                const deltaX = (newWidth - initial.width) / 2; const deltaY = (newHeight - initial.height) / 2;
                if(handle.includes('t')) newY = initial.y - (newHeight - initial.height);
                if(handle.includes('l')) newX = initial.x - (newWidth - initial.width);
                newProps = { width: newWidth, height: newHeight, x: newX, y: newY };
                break;
        }

        // Snapping logic
        const snapV: number[] = [width/2]; const snapH: number[] = [height/2];
        layers.forEach(l => { if (l.id !== activeLayer.id) { snapV.push(l.x, l.x + l.width / 2, l.x + l.width); snapH.push(l.y, l.y + l.height / 2, l.y + l.height); } });
        const newGuides: SnapGuide[] = [];
        const layerBounds = { x: newProps.x ?? activeLayer.x, y: newProps.y ?? activeLayer.y, w: newProps.width ?? activeLayer.width, h: newProps.height ?? activeLayer.height };
        const pointsV = [layerBounds.x, layerBounds.x + layerBounds.w/2, layerBounds.x + layerBounds.w];
        const pointsH = [layerBounds.y, layerBounds.y + layerBounds.h/2, layerBounds.y + layerBounds.h];
        snapV.forEach(sv => { pointsV.forEach((pv, i) => { if(Math.abs(pv - sv) < SNAP_THRESHOLD / viewTransform.zoom) { (newProps as any).x -= (pv - sv); newGuides.push({type: 'v', position: sv}); } }) });
        snapH.forEach(sh => { pointsH.forEach((ph, i) => { if(Math.abs(ph - sh) < SNAP_THRESHOLD / viewTransform.zoom) { (newProps as any).y -= (ph - sh); newGuides.push({type: 'h', position: sh}); } }) });
        setSnapGuides(newGuides);

        updateLayer(activeLayer.id, newProps, false);
    };

    const handleCanvasMouseUp = () => {
        if (interactionState && (interactionState.type === 'move' || interactionState.type === 'scale' || interactionState.type === 'rotate')) {
            const currentLayer = layers.find(l => l.id === interactionState.initialLayerState!.id);
            if (currentLayer && JSON.stringify(currentLayer) !== JSON.stringify(interactionState.initialLayerState)) setState({ layers: [...layers] }, true);
        }
        setInteractionState(null); setSnapGuides([]);
    };

    const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault(); const touches = e.nativeEvent.touches; const rect = canvasRef.current!.getBoundingClientRect();
        if (touches.length === 2) { const t1 = touches[0]; const t2 = touches[1]; const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); const mid = { x: (t1.clientX + t2.clientX)/2, y: (t1.clientY + t2.clientY)/2 }; multiTouchStateRef.current = { initialDist: dist, initialMid: mid, initialZoom: viewTransform.zoom, initialPan: viewTransform.pan }; setInteractionState(null); }
        else if (touches.length === 1) { const touch = touches[0]; const simulatedEvent = { nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top, detail: 1 } } as any; handleCanvasMouseDown(simulatedEvent); }
    };
    const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault(); const touches = e.nativeEvent.touches; const rect = canvasRef.current!.getBoundingClientRect();
        if (touches.length === 2 && multiTouchStateRef.current) { const { initialDist, initialPan, initialZoom, initialMid } = multiTouchStateRef.current; const t1 = touches[0]; const t2 = touches[1]; const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); const newMid = { x: (t1.clientX + t2.clientX)/2, y: (t1.clientY + t2.clientY)/2 }; const zoomDelta = newDist / initialDist; const newZoom = Math.max(0.1, Math.min(initialZoom * zoomDelta, 5)); const newPanX = initialPan.x + (newMid.x - initialMid.x); const newPanY = initialPan.y + (newMid.y - initialMid.y); setViewTransform({ zoom: newZoom, pan: {x: newPanX, y: newPanY }}); }
        else if (touches.length === 1) { const touch = touches[0]; const simulatedEvent = { nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top } } as React.MouseEvent<HTMLCanvasElement>; handleCanvasMouseMove(simulatedEvent); }
    };
    const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); if (e.nativeEvent.touches.length < 2) multiTouchStateRef.current = null; if (e.nativeEvent.touches.length < 1) handleCanvasMouseUp(); };
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault(); const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; const newZoom = Math.max(0.1, Math.min(viewTransform.zoom * zoomFactor, 5)); const mouseX = e.nativeEvent.offsetX; const mouseY = e.nativeEvent.offsetY;
        const newPanX = mouseX - (mouseX - viewTransform.pan.x) * (newZoom / viewTransform.zoom); const newPanY = mouseY - (mouseY - viewTransform.pan.y) * (newZoom / viewTransform.zoom); setViewTransform({ zoom: newZoom, pan: { x: newPanX, y: newPanY } });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return; if (e.code === 'Space' && !e.repeat) { e.preventDefault(); isSpacePressed.current = true; if(canvasRef.current) canvasRef.current.style.cursor='grabbing'; } if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); } if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) { e.preventDefault(); redo(); } if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId !== null) deleteLayer(selectedLayerId); };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') { isSpacePressed.current = false; if(canvasRef.current) canvasRef.current.style.cursor='default'; } };
        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [selectedLayerId, undo, redo, deleteLayer]);

    const handleCreateCanvas = (w:number, h:number, bg:string) => {
        setState({ layers: [], backgroundColor: bg, width: w, height: h }); setCanvasState('editing');
        setTimeout(() => { const container = canvasContainerRef.current; if(container) {
                const zoomX = container.clientWidth / (w + 100); const zoomY = container.clientHeight / (h + 100); const newZoom = Math.min(zoomX, zoomY, 1);
                setViewTransform({ zoom: newZoom, pan: {x: (container.clientWidth - w * newZoom)/2, y: (container.clientHeight - h * newZoom)/2 }});
        }}, 10);
    };
    const handleExport = () => { /* ... simplified for brevity ... */ };
    const handleReorderLayers = (newLayers: Layer[]) => setState({ layers: newLayers });

    useEffect(() => { if(editingText && textInputRef.current) textInputRef.current.focus(); }, [editingText]);
    const handleTextEditBlur = () => {
        if(!editingText) return;
        const newContent = textInputRef.current?.value ?? editingText.initialContent;
        if(newContent !== editingText.initialContent) updateLayer(editingText.layerId, { content: newContent });
        setEditingText(null);
    };

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-background flex flex-col z-50 text-text-body" role="dialog">
            {canvasState === 'setup' && <NewDocumentModal onClose={onClose} onCreate={handleCreateCanvas} />}
            {canvasState === 'editing' && (
                <>
                    <header className="flex-shrink-0 flex justify-between items-center p-1 bg-surface border-b border-border-main">
                        <div className="flex items-center gap-1"><h2 className="text-lg font-bold text-splash px-2" style={{fontFamily: 'var(--font-hand)'}}>Sotoshop</h2><Button size="small" variant="secondary" onClick={undo} disabled={past.length === 0}>Undo</Button><Button size="small" variant="secondary" onClick={redo} disabled={future.length === 0}>Redo</Button></div>
                        <div className="flex items-center gap-2"><span className="text-xs text-text-muted">{Math.round(viewTransform.zoom * 100)}%</span><Button size="small" variant="splash" onClick={handleExport}>Ekspor</Button><Button size="small" variant="secondary" onClick={onClose}>Tutup</Button></div>
                    </header>
                    <div className="flex-grow flex overflow-hidden">
                        <LayersPanel layers={layers} selectedLayerId={selectedLayerId} onSelectLayer={setSelectedLayerId} onUpdateLayer={updateLayer} onDeleteLayer={deleteLayer} onReorderLayers={handleReorderLayers} onAddLayer={addLayer} onUploadClick={() => fileInputRef.current?.click()} />
                        <main ref={canvasContainerRef} className="flex-grow flex items-center justify-center bg-background overflow-hidden relative touch-none">
                            <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} onWheel={handleWheel} onTouchStart={handleCanvasTouchStart} onTouchMove={handleCanvasTouchMove} onTouchEnd={handleCanvasTouchEnd} />
                            <canvas ref={guideCanvasRef} className="absolute inset-0 pointer-events-none" />
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                            {editingText && (
                                <textarea ref={textInputRef} defaultValue={editingText.initialContent} onBlur={handleTextEditBlur}
                                style={{
                                    position: 'absolute', transformOrigin: 'top left',
                                    transform: `translate(${viewTransform.pan.x}px, ${viewTransform.pan.y}px) scale(${viewTransform.zoom})`,
                                    left: `${(layers.find(l=>l.id===editingText.layerId) as TextLayer).x}px`,
                                    top: `${(layers.find(l=>l.id===editingText.layerId) as TextLayer).y}px`,
                                    width: `${(layers.find(l=>l.id===editingText.layerId) as TextLayer).width}px`,
                                    height: `${(layers.find(l=>l.id===editingText.layerId) as TextLayer).height}px`,
                                    font: `${(layers.find(l=>l.id===editingText.layerId) as TextLayer).size}px ${(layers.find(l=>l.id===editingText.layerId) as TextLayer).font}`,
                                    color: (layers.find(l=>l.id===editingText.layerId) as TextLayer).color,
                                    background: 'transparent', border: '1px dashed rgb(var(--c-splash))', outline: 'none', resize: 'none', overflow: 'hidden'
                                }}
                                />
                            )}
                        </main>
                        <PropertiesPanel selectedLayer={selectedLayer} canvasState={currentCanvas} onUpdateLayer={updateLayer} onUpdateCanvas={setState} />
                    </div>
                </>
            )}
        </div>
    );
};

export default Sotoshop;