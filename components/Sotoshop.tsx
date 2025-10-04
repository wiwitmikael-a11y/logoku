// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';

// --- TYPE DEFINITIONS ---
type Tool = 'select' | 'text' | 'shape' | 'hand' | 'image';
type ShapeType = 'rectangle' | 'circle';
type TextAlign = 'left' | 'center' | 'right';
type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'rot';
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
    const [activePopup, setActivePopup] = useState<ActivePopup>({type: 'layers'});
    
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
        newLayer.x = (width / 2) - (newLayer.width / 2); newLayer.y = (height / 2) - (newLayer.height / 2);
        setState({ layers: [...layers, newLayer] }); setSelectedLayerId(newLayer.id);
    };
    const deleteLayer = useCallback((id: number) => { setState({ layers: layers.filter(l => l.id !== id) }); if(selectedLayerId === id) setSelectedLayerId(null); }, [layers, selectedLayerId, setState]);
    const handleReorderLayers = (newLayers: Layer[]) => setState({ layers: newLayers });
    const duplicateLayer = useCallback((id: number) => {
        const layerToDup = layers.find(l => l.id === id); if (!layerToDup) return;
        const newLayer = { ...layerToDup, id: Date.now(), name: `${layerToDup.name} (copy)`, x: layerToDup.x + 20, y: layerToDup.y + 20 };
        setState({ layers: [...layers, newLayer] }); setSelectedLayerId(newLayer.id);
    }, [layers, setState]);
    const moveLayer = useCallback((id: number, direction: 'up' | 'down') => {
        const index = layers.findIndex(l => l.id === id); if (index === -1) return;
        const newLayers = [...layers]; const [layer] = newLayers.splice(index, 1);
        const newIndex = direction === 'up' ? Math.min(layers.length - 1, index + 1) : Math.max(0, index - 1);
        newLayers.splice(newIndex, 0, layer); setState({ layers: newLayers });
    }, [layers, setState]);
    const handleAlign = (alignment: Alignment) => { /* ... */ };

    // --- EVENT HANDLERS (MOUSE & KEYBOARD) ---
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => { /* ... */ };
    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => { /* ... */ };
    const handleCanvasMouseUp = () => { /* ... */ };
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => { /* ... */ };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
    const handleTextEditBlur = () => { /* ... */ };

    // --- REWORKED TOUCH HANDLERS ---
    const screenToCanvasCoords = useCallback((screenX: number, screenY: number) => {
        const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: (screenX - rect.left - viewTransform.pan.x) / viewTransform.zoom, y: (screenY - rect.top - viewTransform.pan.y) / viewTransform.zoom };
    }, [viewTransform]);
    
    const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault(); const touches = e.touches;
        if (touches.length === 1) { // Single touch logic
            const touch = touches[0]; const now = Date.now();
            if (now - lastTapTimeRef.current < DOUBLE_TAP_THRESHOLD) { // Double tap
                const point = screenToCanvasCoords(touch.clientX, touch.clientY);
                const layer = [...layers].reverse().find(l => l.type === 'text' && point.x >= l.x && point.x <= l.x + l.width && point.y >= l.y && point.y <= l.y + l.height);
                if (layer) { setEditingText({ layerId: layer.id, initialContent: (layer as TextLayer).content }); return; }
            }
            lastTapTimeRef.current = now; handleCanvasMouseDown(touch as any);
        } else if (touches.length === 2) { // Multi-touch logic
            const t1 = touches[0]; const t2 = touches[1];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const angle = Math.atan2(t1.clientY - t2.clientY, t1.clientX - t2.clientX) * 180 / Math.PI;
            const midX = (t1.clientX + t2.clientX) / 2; const midY = (t1.clientY + t2.clientY) / 2;
            const selectedLayer = layers.find(l => l.id === selectedLayerId);
            multiTouchStateRef.current = { initialDist: dist, initialAngle: angle, initialLayerState: selectedLayer!, initialPan: viewTransform.pan, initialZoom: viewTransform.zoom, initialMid: {x: midX, y: midY} };
            setInteractionState(null);
        }
    };

    const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault(); const touches = e.touches;
        if (touches.length === 1 && !multiTouchStateRef.current) { handleCanvasMouseMove(touches[0] as any);
        } else if (touches.length === 2 && multiTouchStateRef.current) {
            const { initialDist, initialAngle, initialLayerState, initialPan, initialZoom, initialMid } = multiTouchStateRef.current;
            const t1 = touches[0]; const t2 = touches[1];
            const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const newAngle = Math.atan2(t1.clientY - t2.clientY, t1.clientX - t2.clientX) * 180 / Math.PI;
            const newMidX = (t1.clientX + t2.clientX) / 2; const newMidY = (t1.clientY + t2.clientY) / 2;
            const scale = newDist / initialDist; const rotation = newAngle - initialAngle;

            if (initialLayerState && !initialLayerState.isLocked) { // Rotate & scale layer
                const newWidth = initialLayerState.width * scale; const newHeight = initialLayerState.height * scale;
                 updateLayer(initialLayerState.id, { rotation: initialLayerState.rotation + rotation, width: newWidth, height: newHeight, x: initialLayerState.x - (newWidth - initialLayerState.width) / 2, y: initialLayerState.y - (newHeight - initialLayerState.height) / 2 }, false);
            } else { // Pan & zoom canvas
                const newZoom = initialZoom * scale;
                setViewTransform({ zoom: newZoom, pan: {x: initialPan.x + (newMidX - initialMid.x), y: initialPan.y + (newMidY - initialMid.y)} });
            }
        }
    };
    
    const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (multiTouchStateRef.current) {
            const selectedLayer = layers.find(l => l.id === selectedLayerId);
            if (selectedLayer && !selectedLayer.isLocked) setState({ layers: [...layers] }); // Commit to history
            multiTouchStateRef.current = null;
        } else { handleCanvasMouseUp(); }
    };

    useEffect(() => { /* ... keydown/keyup ... */ }, [/* ... */]);
    useEffect(() => { if(editingText) textInputRef.current?.focus(); }, [editingText]);

    // --- UI/UX Flow ---
    const handleCreateCanvas = (w:number, h:number, bg:string) => {
        setState({ layers: [], backgroundColor: bg, width: w, height: h }); setCanvasState('editing');
        setTimeout(() => { const container = canvasContainerRef.current; if(container) {
                const newZoom = Math.min(container.clientWidth / (w + 100), container.clientHeight / (h + 100), 1);
                setViewTransform({ zoom: newZoom, pan: {x: (container.clientWidth - w * newZoom)/2, y: (container.clientHeight - h * newZoom)/2 }});
        }}, 10);
    };

    const handleCreateCanvasFromImage = (img: HTMLImageElement) => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const newLayer: ImageLayer = {
            id: Date.now(), type: 'image', name: 'Background Image', x: 0, y: 0, width: w, height: h, rotation: 0, isVisible: true, isLocked: false, opacity: 100, shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#00000000' }, image: img, filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0 },
        };
        dispatchHistory({ type: 'SET_STATE', newState: { layers: [newLayer], backgroundColor: '#101012', width: w, height: h }, withHistory: true });
        setCanvasState('editing');
        setTimeout(() => { const container = canvasContainerRef.current; if (container) {
                const newZoom = Math.min(container.clientWidth / (w + 100), container.clientHeight / (h + 100), 0.9);
                setViewTransform({ zoom: newZoom, pan: { x: (container.clientWidth - w * newZoom) / 2, y: (container.clientHeight - h * newZoom) / 2 } });
        }}, 10);
    };

    const handleExport = () => { /* ... */ };
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    
    // --- REDRAW TRIGGER ---
    useEffect(() => { if (show && canvasState === 'editing') redrawCanvas(); }, [show, redrawCanvas, canvasState, viewTransform]);
    useEffect(() => { const handler = () => { if(canvasState === 'editing') redrawCanvas(); }; window.addEventListener('resize', handler); return () => window.removeEventListener('resize', handler);}, [canvasState, redrawCanvas]);

    // --- NEW UI COMPONENTS ---
    const HorizontalToolbar: React.FC = () => { /* ... */ };
    const BottomToolbar: React.FC = () => {
        const ToolButton: React.FC<{ tool: Tool; title: string; children: React.ReactNode }> = ({ tool, title, children }) => (
            <button title={title} onClick={() => setActiveTool(tool)} className={`flex flex-col items-center gap-1 p-2 rounded-md w-16 ${activeTool === tool ? 'text-splash' : 'text-text-muted hover:bg-background'}`}>
                {children} <span className="text-xs">{title}</span>
            </button>
        );
         return (
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/80 backdrop-blur-md border border-border-main rounded-xl shadow-2xl p-1 z-10">
                <ToolButton tool="select" title="Select"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3.5m0 0a1.5 1.5 0 01-3 0V11" /></svg></ToolButton>
                <ToolButton tool="text" title="Text"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v18M6.6 14h5.8M6.4 7.5h6.2" /></svg></ToolButton>
                <button onClick={() => addLayer('shape', { shapeType: 'rectangle' })} className="flex flex-col items-center gap-1 p-2 rounded-md w-16 text-text-muted hover:bg-background"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg><span className="text-xs">Shape</span></button>
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2 rounded-md w-16 text-text-muted hover:bg-background"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-xs">Image</span></button>
             </div>
         );
    }
    
    const ContextualToolbar: React.FC = () => {
        if (!selectedLayer) return null;
         return (
             <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/80 backdrop-blur-md border border-border-main rounded-lg shadow-2xl p-1 z-10">
                <button onClick={() => duplicateLayer(selectedLayer.id)} title="Duplicate" className="p-2 text-text-muted hover:bg-background rounded-md"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg></button>
                <button onClick={() => moveLayer(selectedLayer.id, 'up')} title="Bring Forward" className="p-2 text-text-muted hover:bg-background rounded-md"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 5.293a1 1 0 010 1.414L8.414 9H14a1 1 0 110 2H8.414l2.293 2.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" /></svg></button>
                <button onClick={() => moveLayer(selectedLayer.id, 'down')} title="Send Backward" className="p-2 text-text-muted hover:bg-background rounded-md"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.293 14.707a1 1 0 010-1.414L11.586 11H6a1 1 0 110-2h5.586l-2.293-2.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg></button>
                <button onClick={() => deleteLayer(selectedLayer.id)} title="Delete" className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
             </div>
         );
    }

    const FloatingLayersPanel: React.FC = () => { /* ... */ };
    const FloatingPropertiesPanel: React.FC = () => { /* ... */ };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-background flex flex-col z-50 text-text-body" role="dialog" onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp}>
            {canvasState === 'setup' && <NewDocumentModal onClose={onClose} onCreate={handleCreateCanvas} onCreateFromImage={handleCreateCanvasFromImage} />}
            {canvasState === 'editing' && (
                <>
                    <header className="relative flex-shrink-0 flex justify-between items-center p-1 bg-surface border-b border-border-main">
                        <h2 className="text-2xl font-bold text-text-header px-2 pt-1.5 tracking-wider" style={{fontFamily: 'var(--font-display)'}}>Sotoshop</h2>
                        <div className="flex items-center gap-2 pt-1.5">
                             <Button size="small" variant="secondary" onClick={() => setActivePopup(p => ({type: p.type === 'layers' ? null : 'layers'}))}>Layers</Button>
                             <Button size="small" variant="secondary" onClick={() => { if(selectedLayer) setActivePopup(p => ({type: p.type === 'properties' ? null : 'properties'})); else playSound('error'); }} disabled={!selectedLayer}>Properties</Button>
                            <Button size="small" variant="secondary" onClick={onClose}>Tutup</Button>
                        </div>
                    </header>
                    <main ref={canvasContainerRef} className="flex-grow flex items-center justify-center bg-background overflow-hidden relative touch-none">
                        <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onWheel={handleWheel} onTouchStart={handleCanvasTouchStart} onTouchMove={handleCanvasTouchMove} onTouchEnd={handleCanvasTouchEnd} />
                        <canvas ref={guideCanvasRef} className="absolute inset-0 pointer-events-none" />
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                        {editingText && ( <textarea ref={textInputRef} defaultValue={editingText.initialContent} onBlur={handleTextEditBlur} style={{/* ... */}} /> )}
                        <ContextualToolbar />
                        <BottomToolbar />
                        <FloatingLayersPanel />
                        <FloatingPropertiesPanel />
                    </main>
                </>
            )}
        </div>
    );
};

export default Sotoshop;