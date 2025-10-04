// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';

// --- TYPE DEFINITIONS ---
export type Tool = 'select' | 'text' | 'shape' | 'hand' | 'image';
export type ShapeType = 'rectangle' | 'circle';
export type TextAlign = 'left' | 'center' | 'right';
export type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'rot';
type Alignment = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';


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
type ActivePopup = { type: 'properties' | 'layers' | 'bg_color' | 'file' | 'shape' | null; position?: {x: number, y:number}}

const CANVAS_PRESETS: {[key: string]: {w: number, h: number}} = { 'Instagram Post (1:1)': { w: 1080, h: 1080 }, 'Instagram Story (9:16)': { w: 1080, h: 1920 }, 'Facebook Post': { w: 1200, h: 630 }, 'Twitter Post': { w: 1600, h: 900 } };
const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 20;
const SNAP_THRESHOLD = 5;
const DOUBLE_TAP_THRESHOLD = 300; // ms

// --- NEW FONT LIBRARY ---
const FONT_CATEGORIES = [
    { label: "Sans Serif (Modern & Jelas)", fonts: ["Poppins", "Montserrat", "Oswald", "Roboto", "Plus Jakarta Sans"] },
    { label: "Serif (Klasik & Elegan)", fonts: ["Playfair Display", "Lora"] },
    { label: "Display & Script (Gaya Unik)", fonts: ["Anton", "Bebas Neue", "Lobster", "Pacifico", "Satisfy", "Caveat"] }
];


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
    onCreateFromImage: (image: HTMLImageElement) => void;
}> = ({ onClose, onCreate, onCreateFromImage }) => {
    const [preset, setPreset] = useState(Object.keys(CANVAS_PRESETS)[0]);
    const [width, setWidth] = useState(CANVAS_PRESETS[preset].w);
    const [height, setHeight] = useState(CANVAS_PRESETS[preset].h);
    const [bgColor, setBgColor] = useState('#101012');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const p = CANVAS_PRESETS[preset];
        if (p) {
            setWidth(p.w);
            setHeight(p.h);
        }
    }, [preset]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            if (imageUrl) {
                const img = new Image();
                img.src = imageUrl;
                img.onload = () => {
                    onCreateFromImage(img);
                };
            }
        };
        reader.readAsDataURL(file);
    };

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

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-border-main" /></div>
                    <div className="relative flex justify-center"><span className="bg-surface px-2 text-sm text-text-muted">Or</span></div>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    Upload Image & Start Editing
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const Sotoshop: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
    
    // --- STATE MANAGEMENT ---
    const [canvasState, setCanvasState] = useState<'setup' | 'editing'>('setup');
    const [history, dispatchHistory] = useReducer(historyReducer, { past: [], present: { layers: [], backgroundColor: '#101012', width: 1080, height: 1080 }, future: [] });
    const { present: currentCanvas, past, future } = history;
    const { layers, backgroundColor, width, height } = currentCanvas;

    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>('select');
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
    const lastTapTimeRef = useRef(0);
    const multiTouchStateRef = useRef<{ initialDist: number; initialAngle: number; initialLayerState: Layer; initialPan: {x:number, y:number}; initialZoom: number; initialMid: {x:number, y:number} } | null>(null);


    // --- CORE ACTIONS ---
    const setState = (newState: Partial<CanvasState>, withHistory = true) => dispatchHistory({ type: 'SET_STATE', newState, withHistory });
    const undo = useCallback(() => { playSound('select'); dispatchHistory({ type: 'UNDO' }); }, []);
    const redo = useCallback(() => { playSound('select'); dispatchHistory({ type: 'REDO' }); }, []);

    // --- DRAWING & CANVAS LOGIC ---
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
    
    const drawGuides = useCallback((guides: SnapGuide[]) => {
        const canvas = guideCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        ctx.save();
        ctx.translate(viewTransform.pan.x, viewTransform.pan.y);
        ctx.scale(viewTransform.zoom, viewTransform.zoom);
        ctx.strokeStyle = 'rgb(var(--c-splash))';
        ctx.lineWidth = 1 / viewTransform.zoom;

        guides.forEach(guide => {
            ctx.beginPath();
            if (guide.type === 'h') {
                ctx.moveTo(0, guide.position);
                ctx.lineTo(width, guide.position);
            } else {
                ctx.moveTo(guide.position, 0);
                ctx.lineTo(guide.position, height);
            }
            ctx.stroke();
        });
        ctx.restore();
    }, [viewTransform, width, height]);


    // --- LAYER & STATE MANIPULATION ---
    const updateLayer = (id: number, props: Partial<Layer>, withHistory = true) => setState({ layers: layers.map(l => (l.id === id ? { ...l, ...props } : l)) }, withHistory);
    const addLayer = (type: 'text' | 'shape' | 'image', options: any = {}) => {
        let newLayer: Layer; const defaultShadow = { offsetX: 2, offsetY: 2, blur: 4, color: '#00000080' };
        const common = { id: Date.now(), x: 0, y: 0, rotation: 0, isVisible: true, isLocked: false, opacity: 100, shadow: defaultShadow };
        if (type === 'text') { newLayer = { ...common, name: "Teks Baru", type: 'text', content: 'Teks Baru', font: 'Plus Jakarta Sans', size: 48, color: '#FFFFFF', width: 200, height: 50, textAlign: 'left' }; }
        else if (type === 'image') { newLayer = { ...common, name: options.name || "Gambar", type: 'image', image: options.image, width: options.image.naturalWidth, height: options.image.naturalHeight, filters: {brightness: 100, contrast: 100, saturate: 100, grayscale: 0} }; }
        else { newLayer = { ...common, name: "Bentuk Baru", type: 'shape', shape: options.shapeType!, fillColor: '#c026d3', strokeColor: '#000000', strokeWidth: 0, width: 150, height: 150 }; }
        // Center the new layer
        newLayer.x = (width / 2) - (newLayer.width / 2);
        newLayer.y = (height / 2) - (newLayer.height / 2);
        setState({ layers: [...layers, newLayer] }); setSelectedLayerId(newLayer.id);
    };
    const deleteLayer = useCallback((id: number) => { setState({ layers: layers.filter(l => l.id !== id) }); if(selectedLayerId === id) setSelectedLayerId(null); }, [layers, selectedLayerId, setState]);
    const handleReorderLayers = (newLayers: Layer[]) => setState({ layers: newLayers });
    const duplicateLayer = useCallback((id: number) => {
        const layerToDup = layers.find(l => l.id === id);
        if (!layerToDup) return;
        const newLayer = { ...layerToDup, id: Date.now(), name: `${layerToDup.name} (copy)`, x: layerToDup.x + 20, y: layerToDup.y + 20 };
        setState({ layers: [...layers, newLayer] });
        setSelectedLayerId(newLayer.id);
    }, [layers, setState]);
    const moveLayer = useCallback((id: number, direction: 'up' | 'down') => {
        const index = layers.findIndex(l => l.id === id);
        if (index === -1) return;
        const newLayers = [...layers];
        const [layer] = newLayers.splice(index, 1);
        const newIndex = direction === 'up' ? Math.min(layers.length - 1, index + 1) : Math.max(0, index - 1);
        newLayers.splice(newIndex, 0, layer);
        setState({ layers: newLayers });
    }, [layers, setState]);


    const handleAlign = (alignment: Alignment) => {
        const layer = layers.find(l => l.id === selectedLayerId);
        if (!layer) return;
        let newProps: Partial<Layer> = {};
        switch (alignment) {
            case 'left': newProps.x = 0; break;
            case 'center-h': newProps.x = (width - layer.width) / 2; break;
            case 'right': newProps.x = width - layer.width; break;
            case 'top': newProps.y = 0; break;
            case 'center-v': newProps.y = (height - layer.height) / 2; break;
            case 'bottom': newProps.y = height - layer.height; break;
        }
        updateLayer(layer.id, newProps);
    };

    // --- EVENT HANDLERS ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            if (imageUrl) {
                const img = new Image();
                img.src = imageUrl;
                img.onload = () => {
                    addLayer('image', { image: img, name: file.name });
                };
            }
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset for re-uploading the same file
    };
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
    
    // --- REWORKED TOUCH HANDLERS ---
    const screenToCanvasCoords = useCallback((screenX: number, screenY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = (screenX - rect.left - viewTransform.pan.x) / viewTransform.zoom;
        const y = (screenY - rect.top - viewTransform.pan.y) / viewTransform.zoom;
        return { x, y };
    }, [viewTransform]);
    
    const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touches = e.touches;

        if (touches.length === 1) { // Single touch
            const touch = touches[0];
            const now = Date.now();
            const timeSinceLastTap = now - lastTapTimeRef.current;
            lastTapTimeRef.current = now;

            const point = screenToCanvasCoords(touch.clientX, touch.clientY);

            // Double tap to edit text
            if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
                 const layer = [...layers].reverse().find(l => l.type === 'text' && point.x >= l.x && point.x <= l.x + l.width && point.y >= l.y && point.y <= l.y + l.height);
                if (layer) {
                    setEditingText({ layerId: layer.id, initialContent: (layer as TextLayer).content });
                    return;
                }
            }
            
            // Standard mouse down logic for single touch
             handleCanvasMouseDown(touch as any); // Type assertion to reuse logic

        } else if (touches.length === 2) { // Multi-touch
            const t1 = touches[0];
            const t2 = touches[1];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const angle = Math.atan2(t1.clientY - t2.clientY, t1.clientX - t2.clientX) * 180 / Math.PI;
            const midX = (t1.clientX + t2.clientX) / 2;
            const midY = (t1.clientY + t2.clientY) / 2;
            
            const selectedLayer = layers.find(l => l.id === selectedLayerId);

            multiTouchStateRef.current = {
                initialDist: dist,
                initialAngle: angle,
                initialLayerState: selectedLayer!,
                initialPan: viewTransform.pan,
                initialZoom: viewTransform.zoom,
                initialMid: {x: midX, y: midY}
            };
            setInteractionState(null); // Stop any single-touch interactions
        }
    };

    const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touches = e.touches;
        if (touches.length === 1 && !multiTouchStateRef.current) {
            handleCanvasMouseMove(touches[0] as any);
        } else if (touches.length === 2 && multiTouchStateRef.current) {
            const { initialDist, initialAngle, initialLayerState, initialPan, initialZoom, initialMid } = multiTouchStateRef.current;
            const t1 = touches[0]; const t2 = touches[1];
            const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const newAngle = Math.atan2(t1.clientY - t2.clientY, t1.clientX - t2.clientX) * 180 / Math.PI;
            const newMidX = (t1.clientX + t2.clientX) / 2;
            const newMidY = (t1.clientY + t2.clientY) / 2;
            
            const scale = newDist / initialDist;
            const rotation = newAngle - initialAngle;

            if (initialLayerState && !initialLayerState.isLocked) { // Rotate & scale layer
                const newWidth = initialLayerState.width * scale;
                const newHeight = initialLayerState.height * scale;
                 updateLayer(initialLayerState.id, {
                    rotation: initialLayerState.rotation + rotation,
                    width: newWidth, height: newHeight,
                    x: initialLayerState.x - (newWidth - initialLayerState.width) / 2,
                    y: initialLayerState.y - (newHeight - initialLayerState.height) / 2
                }, false);
            } else { // Pan & zoom canvas
                const newZoom = initialZoom * scale;
                const panX = initialPan.x + (newMidX - initialMid.x);
                const panY = initialPan.y + (newMidY - initialMid.y);
                setViewTransform({ zoom: newZoom, pan: {x: panX, y: panY} });
            }
        }
    };
    
    const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (multiTouchStateRef.current) {
            const selectedLayer = layers.find(l => l.id === selectedLayerId);
            if (selectedLayer && !selectedLayer.isLocked) setState({ layers: [...layers] }); // Commit to history
            multiTouchStateRef.current = null;
        } else {
            handleCanvasMouseUp();
        }
    };

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

    const handleCreateCanvasFromImage = (img: HTMLImageElement) => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const newLayer: ImageLayer = {
            id: Date.now(),
            type: 'image',
            name: 'Background Image',
            x: 0,
            y: 0,
            width: w,
            height: h,
            rotation: 0,
            isVisible: true,
            isLocked: false,
            opacity: 100,
            shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#00000000' },
            image: img,
            filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0 },
        };
        dispatchHistory({ type: 'SET_STATE', newState: { layers: [newLayer], backgroundColor: '#101012', width: w, height: h }, withHistory: true });
        setCanvasState('editing');
        setTimeout(() => {
            const container = canvasContainerRef.current;
            if (container) {
                const zoomX = container.clientWidth / (w + 100);
                const zoomY = container.clientHeight / (h + 100);
                const newZoom = Math.min(zoomX, zoomY, 0.9);
                setViewTransform({ zoom: newZoom, pan: { x: (container.clientWidth - w * newZoom) / 2, y: (container.clientHeight - h * newZoom) / 2 } });
            }
        }, 10);
    };

    const handleExport = () => { /* ... simplified for brevity ... */ };

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    
    // --- REDRAW TRIGGER ---
    useEffect(() => { if (show && canvasState === 'editing') redrawCanvas(); }, [show, redrawCanvas, canvasState, viewTransform]);
    useEffect(() => { const handler = () => { if(canvasState === 'editing') redrawCanvas(); }; window.addEventListener('resize', handler); return () => window.removeEventListener('resize', handler);}, [canvasState, redrawCanvas]);

    // --- NEW UI COMPONENTS ---
    const HorizontalToolbar: React.FC = () => {
        const ToolButton: React.FC<{ tool: Tool; title: string; children: React.ReactNode }> = ({ tool, title, children }) => (
            <button title={title} onClick={() => setActiveTool(tool)} className={`p-2.5 rounded-md ${activeTool === tool ? 'bg-splash text-white' : 'text-text-muted hover:bg-background'}`}>
                {children}
            </button>
        );

        return (
            <div className="flex-shrink-0 bg-surface border-b border-border-main p-1 overflow-x-auto">
                <div className="flex items-center gap-1 w-max">
                    <div className="relative">
                        <Button size="small" variant="secondary" onClick={() => setActivePopup(p => ({type: p.type === 'file' ? null : 'file'}))}>File</Button>
                        {activePopup.type === 'file' && (
                            <div className="absolute top-full left-0 mt-1 bg-surface border border-border-main rounded-md shadow-lg py-1 w-48 z-20">
                                <button onClick={() => { setCanvasState('setup'); setActivePopup({type: null}); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-background">New Canvas...</button>
                                <button onClick={handleExport} className="w-full text-left px-3 py-1.5 text-sm hover:bg-background">Export as PNG</button>
                            </div>
                        )}
                    </div>
                    <Button size="small" variant="secondary" onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">Undo</Button>
                    <Button size="small" variant="secondary" onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)">Redo</Button>
                    <div className="w-px h-6 bg-border-main mx-1"></div>

                    <ToolButton tool="select" title="Select Tool (V)"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3.5m0 0a1.5 1.5 0 01-3 0V11" /></svg></ToolButton>
                    <ToolButton tool="hand" title="Hand Tool (Spacebar)"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3.5m0 0a1.5 1.5 0 01-3 0V11" /></svg></ToolButton>
                    <ToolButton tool="text" title="Text Tool (T)"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.243 3.5a1 1 0 011.514 0l6.243 7.5a1 1 0 01-.757 1.65H3.757a1 1 0 01-.757-1.65l6.243-7.5zM9 13a1 1 0 112 0v3a1 1 0 11-2 0v-3z" clipRule="evenodd" /></svg></ToolButton>

                    <div className="relative">
                        <button title="Shape Tool" onClick={() => setActivePopup(p => ({ type: p.type === 'shape' ? null : 'shape' }))} className={`p-2.5 rounded-md text-text-muted hover:bg-background`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg></button>
                        {activePopup.type === 'shape' && (
                            <div className="absolute top-full left-0 mt-1 bg-surface border border-border-main rounded-md shadow-lg py-1 w-40 z-20">
                                <button onClick={() => { addLayer('shape', { shapeType: 'rectangle' }); setActivePopup({ type: null }); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-background">Rectangle</button>
                                <button onClick={() => { addLayer('shape', { shapeType: 'circle' }); setActivePopup({ type: null }); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-background">Circle</button>
                            </div>
                        )}
                    </div>
                    <button title="Upload Image" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-md text-text-muted hover:bg-background"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                    <div className="w-px h-6 bg-border-main mx-1"></div>

                    {selectedLayer && (
                        <div className="flex items-center gap-1 border-l border-border-main pl-2">
                             <button onClick={() => handleAlign('left')} title="Align Left" className="p-2.5 rounded-md text-text-muted hover:bg-background"><svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3H13v10h-2.5V3zM3 3h2.5v10H3V3z"/></svg></button>
                             <button onClick={() => handleAlign('center-h')} title="Align Center" className="p-2.5 rounded-md text-text-muted hover:bg-background"><svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3H13v10h-2.5V3zM3 3h2.5v10H3V3zM6.75 3h2.5v10h-2.5V3z"/></svg></button>
                             <button onClick={() => handleAlign('right')} title="Align Right" className="p-2.5 rounded-md text-text-muted hover:bg-background"><svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h2.5v10H3V3zm10 0h-2.5v10H13V3z"/></svg></button>
                             <div className="w-px h-5 bg-border-main mx-1"></div>
                             <button onClick={() => handleAlign('top')} title="Align Top" className="p-2.5 rounded-md text-text-muted hover:bg-background"><svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor" style={{transform: 'rotate(90deg)'}}><path d="M10.5 3H13v10h-2.5V3zM3 3h2.5v10H3V3z"/></svg></button>
                             <button onClick={() => handleAlign('center-v')} title="Align Middle" className="p-2.5 rounded-md text-text-muted hover:bg-background"><svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor" style={{transform: 'rotate(90deg)'}}><path d="M10.5 3H13v10h-2.5V3zM3 3h2.5v10H3V3zM6.75 3h2.5v10h-2.5V3z"/></svg></button>
                             <button onClick={() => handleAlign('bottom')} title="Align Bottom" className="p-2.5 rounded-md text-text-muted hover:bg-background"><svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor" style={{transform: 'rotate(90deg)'}}><path d="M3 3h2.5v10H3V3zm10 0h-2.5v10H13V3z"/></svg></button>
                        </div>
                    )}
                    
                    <div className="flex-grow"></div>

                    <label className="flex items-center gap-2 p-2 text-sm font-semibold rounded-lg hover:bg-background cursor-pointer"><span className="text-text-muted">Background</span><input type="color" value={backgroundColor} onChange={e => setState({backgroundColor: e.target.value}, true)} className="w-6 h-6 p-0 bg-transparent border-none rounded"/></label>
                    <div className="w-px h-6 bg-border-main mx-1"></div>
                    <div className="flex items-center gap-1 text-text-muted">
                        <button onClick={() => setViewTransform(v => ({...v, zoom: v.zoom * 0.8}))} className="p-1 rounded hover:bg-background">-</button>
                        <span className="text-xs w-12 text-center">{Math.round(viewTransform.zoom * 100)}%</span>
                        <button onClick={() => setViewTransform(v => ({...v, zoom: v.zoom * 1.25}))} className="p-1 rounded hover:bg-background">+</button>
                    </div>
                </div>
            </div>
        );
    };

    const FloatingLayersPanel: React.FC = () => {
        if (activePopup.type !== 'layers') return null;

        const [draggedItem, setDraggedItem] = useState<number | null>(null);

        const handleDragStart = (e: React.DragEvent, id: number) => { setDraggedItem(id); e.dataTransfer.effectAllowed = "move"; };
        const handleDragOver = (e: React.DragEvent) => e.preventDefault();
        const handleDrop = (targetId: number) => {
            if (draggedItem === null || draggedItem === targetId) return;
            const draggedIndex = layers.findIndex(l => l.id === draggedItem);
            const targetIndex = layers.findIndex(l => l.id === targetId);
            const newLayers = [...layers];
            const [removed] = newLayers.splice(draggedIndex, 1);
            newLayers.splice(targetIndex, 0, removed);
            handleReorderLayers(newLayers);
            setDraggedItem(null);
        };
        
        return (
             <div className="absolute w-64 bg-surface/90 backdrop-blur-md border border-border-main rounded-lg shadow-2xl flex flex-col" style={{ top: panelPositions.layers.y, left: panelPositions.layers.x }}>
                <div onMouseDown={(e) => setInteractionState({type: 'drag_panel', panel: 'layers', initialMouse: {x: e.clientX, y: e.clientY}, initialPanelPos: panelPositions.layers })} className="p-2 cursor-move border-b border-border-main flex justify-between items-center"><h3 className="font-bold text-text-header text-sm">Layers</h3><button onClick={() => setActivePopup({type: null})} className="p-1 text-text-muted hover:text-white">&times;</button></div>
                <div className="flex-grow overflow-y-auto space-y-1 p-1 max-h-80">{[...layers].reverse().map(l => (
                    <div key={l.id} draggable onDragStart={(e) => handleDragStart(e, l.id)} onDragOver={handleDragOver} onDrop={() => handleDrop(l.id)} onClick={() => setSelectedLayerId(l.id)}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${selectedLayerId === l.id ? 'bg-splash/20' : 'hover:bg-background'}`}>
                        <button onClick={(e) => { e.stopPropagation(); updateLayer(l.id, { isVisible: !l.isVisible }); }} className="p-1 text-text-muted hover:text-white">{ l.isVisible ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" /></svg> }</button>
                        <span className="flex-grow text-sm truncate">{l.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); updateLayer(l.id, { isLocked: !l.isLocked }); }} className="p-1 text-text-muted hover:text-white">{ l.isLocked ? <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg> : <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 9a3 3 0 100-6 3 3 0 000 6z" /></svg> }</button>
                    </div>
                ))}</div>
            </div>
        );
    };
    
    const FloatingPropertiesPanel: React.FC = () => {
        if(activePopup.type !== 'properties' || !selectedLayer) return null;
        const updateLayerNoHistory = (props: Partial<Layer>) => updateLayer(selectedLayer.id, props, false);
        const commitHistory = () => setState({ layers: [...layers] });

        return(
            <div className="absolute w-64 bg-surface/90 backdrop-blur-md border border-border-main rounded-lg shadow-2xl flex flex-col" style={{ top: panelPositions.properties.y, left: panelPositions.properties.x }}>
                <div onMouseDown={(e) => setInteractionState({type: 'drag_panel', panel: 'properties', initialMouse: {x: e.clientX, y: e.clientY}, initialPanelPos: panelPositions.properties })} className="p-2 cursor-move border-b border-border-main flex justify-between items-center"><h3 className="font-bold text-text-header text-sm">Properties</h3><button onClick={() => setActivePopup({type: null})} className="p-1 text-text-muted hover:text-white">&times;</button></div>
                <div className="p-2 space-y-3 max-h-96 overflow-y-auto">
                    <PanelSection title="Transform" defaultOpen={true}>
                        <div className="grid grid-cols-2 gap-2">
                             <PropertyInput label="X" type="number" value={Math.round(selectedLayer.x)} onChange={e => updateLayerNoHistory({ x: parseInt(e.target.value) })} onBlur={commitHistory} />
                             <PropertyInput label="Y" type="number" value={Math.round(selectedLayer.y)} onChange={e => updateLayerNoHistory({ y: parseInt(e.target.value) })} onBlur={commitHistory} />
                             <PropertyInput label="Width" type="number" value={Math.round(selectedLayer.width)} onChange={e => updateLayerNoHistory({ width: parseInt(e.target.value) })} onBlur={commitHistory} />
                             <PropertyInput label="Height" type="number" value={Math.round(selectedLayer.height)} onChange={e => updateLayerNoHistory({ height: parseInt(e.target.value) })} onBlur={commitHistory} />
                        </div>
                        <PropertyInput label="Rotation" type="number" value={Math.round(selectedLayer.rotation)} onChange={e => updateLayerNoHistory({ rotation: parseInt(e.target.value) })} onBlur={commitHistory} suffix="°" />
                    </PanelSection>

                    { selectedLayer.type === 'text' && (
                         <PanelSection title="Text">
                            <PropertyTextarea label="Content" value={selectedLayer.content} onChange={e => updateLayer(selectedLayer.id, { content: e.target.value })} rows={3} />
                            <PropertySelect label="Font" value={selectedLayer.font} onChange={e => updateLayer(selectedLayer.id, { font: e.target.value })}>
                                {FONT_CATEGORIES.map(category => (
                                    <optgroup label={category.label} key={category.label}>
                                        {category.fonts.map(font => <option key={font} value={font}>{font}</option>)}
                                    </optgroup>
                                ))}
                            </PropertySelect>
                            <div className="grid grid-cols-2 gap-2">
                                <PropertyInput label="Size" type="number" value={selectedLayer.size} onChange={e => updateLayer(selectedLayer.id, { size: parseInt(e.target.value) || 12 })} suffix="px" />
                                <PropertyColorInput label="Color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} />
                            </div>
                            <PropertySelect label="Align" value={selectedLayer.textAlign} onChange={e => updateLayer(selectedLayer.id, { textAlign: e.target.value as TextAlign })}>
                                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                            </PropertySelect>
                        </PanelSection>
                    )}
                    { selectedLayer.type === 'shape' && (
                        <PanelSection title="Shape">
                            <PropertyColorInput label="Fill" value={selectedLayer.fillColor} onChange={e => updateLayer(selectedLayer.id, { fillColor: e.target.value })}/>
                            <PropertyColorInput label="Stroke" value={selectedLayer.strokeColor} onChange={e => updateLayer(selectedLayer.id, { strokeColor: e.target.value })}/>
                            <PropertyInput label="Stroke Width" type="number" value={selectedLayer.strokeWidth} min={0} onChange={e => updateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value) })} />
                        </PanelSection>
                    )}
                    { selectedLayer.type === 'image' && (
                        <PanelSection title="Image Filters">
                             <div><label className="flex justify-between text-text-muted text-xs"><span>Brightness</span><span>{selectedLayer.filters.brightness}%</span></label><input type="range" min="0" max="200" value={selectedLayer.filters.brightness} onChange={e => updateLayerNoHistory({ filters: {...selectedLayer.filters, brightness: +e.target.value }})} onMouseUp={commitHistory} className="w-full" /></div>
                             <div><label className="flex justify-between text-text-muted text-xs"><span>Contrast</span><span>{selectedLayer.filters.contrast}%</span></label><input type="range" min="0" max="200" value={selectedLayer.filters.contrast} onChange={e => updateLayerNoHistory({ filters: {...selectedLayer.filters, contrast: +e.target.value }})} onMouseUp={commitHistory} className="w-full" /></div>
                             <div><label className="flex justify-between text-text-muted text-xs"><span>Saturation</span><span>{selectedLayer.filters.saturate}%</span></label><input type="range" min="0" max="200" value={selectedLayer.filters.saturate} onChange={e => updateLayerNoHistory({ filters: {...selectedLayer.filters, saturate: +e.target.value }})} onMouseUp={commitHistory} className="w-full" /></div>
                        </PanelSection>
                    )}
                    <PanelSection title="Shadow">
                        <PropertyInput label="Offset X" type="number" value={selectedLayer.shadow.offsetX} onChange={e => updateLayer(selectedLayer.id, { shadow: {...selectedLayer.shadow, offsetX: +e.target.value }})} />
                        <PropertyInput label="Offset Y" type="number" value={selectedLayer.shadow.offsetY} onChange={e => updateLayer(selectedLayer.id, { shadow: {...selectedLayer.shadow, offsetY: +e.target.value }})} />
                        <PropertyInput label="Blur" type="number" min="0" value={selectedLayer.shadow.blur} onChange={e => updateLayer(selectedLayer.id, { shadow: {...selectedLayer.shadow, blur: +e.target.value }})} />
                        <PropertyColorInput label="Color" value={selectedLayer.shadow.color} onChange={e => updateLayer(selectedLayer.id, { shadow: {...selectedLayer.shadow, color: e.target.value }})} />
                    </PanelSection>
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
            {canvasState === 'setup' && <NewDocumentModal onClose={onClose} onCreate={handleCreateCanvas} onCreateFromImage={handleCreateCanvasFromImage} />}
            {canvasState === 'editing' && (
                <>
                    <header className="relative flex-shrink-0 flex justify-between items-center p-1 bg-surface border-b border-border-main">
                         <div className="absolute top-0 left-0 w-full h-1.5 sotoshop-accent-stripes"></div>
                        <h2 className="text-2xl font-bold text-text-header px-2 pt-1.5 tracking-wider" style={{fontFamily: 'var(--font-display)'}}>Sotoshop</h2>
                        <div className="flex items-center gap-2 pt-1.5">
                             <Button size="small" variant="secondary" onClick={() => setActivePopup(p => ({type: p.type === 'layers' ? null : 'layers'}))}>Layers</Button>
                             <Button size="small" variant="secondary" onClick={() => setActivePopup(p => ({type: p.type === 'properties' ? null : 'properties'}))}>Properties</Button>
                            <Button size="small" variant="secondary" onClick={onClose}>Tutup</Button>
                        </div>
                    </header>
                    <HorizontalToolbar />
                    <main ref={canvasContainerRef} className="flex-grow flex items-center justify-center bg-background overflow-hidden relative touch-none">
                        <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onWheel={handleWheel} onTouchStart={handleCanvasTouchStart} onTouchMove={handleCanvasTouchMove} onTouchEnd={handleCanvasTouchEnd} />
                        <canvas ref={guideCanvasRef} className="absolute inset-0 pointer-events-none" />
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                        {editingText && ( <textarea ref={textInputRef} defaultValue={editingText.initialContent} onBlur={handleTextEditBlur} style={{/* ... */}} /> )}
                        {/* FIX: Removed call to non-existent ContextualToolbar component */}
                        <FloatingLayersPanel />
                        <FloatingPropertiesPanel />
                    </main>
                </>
            )}
        </div>
    );
};

export default Sotoshop;
