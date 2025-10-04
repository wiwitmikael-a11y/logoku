// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import * as geminiService from '../services/geminiService';
import type { Profile } from '../types';

// --- TYPE DEFINITIONS ---
type Tool = 'select' | 'text' | 'shape' | 'hand' | 'image' | 'elements' | 'ai_generate';
type ShapeType = 'rectangle' | 'circle';
type TextAlign = 'left' | 'center' | 'right';
type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'rot';
type BlendMode = GlobalCompositeOperation;

export interface Shadow { offsetX: number; offsetY: number; blur: number; color: string; }
export interface Filters { brightness: number; contrast: number; saturate: number; grayscale: number; }

export interface BaseLayer { id: number; type: 'text' | 'image' | 'shape'; name: string; x: number; y: number; width: number; height: number; rotation: number; isVisible: boolean; isLocked: boolean; opacity: number; shadow: Shadow; blendMode: BlendMode; }
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
    
type InteractionState = 
    | { type: 'move' | 'scale' | 'rotate' | 'pan'; handle?: Handle; initialLayerState?: Layer; initialPoint: { x: number; y: number; }; layerCenter?: { x: number; y: number; }; aspectRatio?: number; } 
    | { type: 'drag_panel', panel: 'layers' | 'properties' | 'elements', initialMouse: {x:number, y:number}, initialPanelPos: {x:number, y:number} } 
    | null;

type EditingText = { layerId: number; initialContent: string; } | null;
type SnapGuide = { type: 'v' | 'h', position: number };

interface SotoshopProps {
  show: boolean;
  onClose: () => void;
  profile: Profile | null;
  deductCredits: (amount: number) => Promise<boolean>;
  setShowOutOfCreditsModal: (show: boolean) => void;
  addXp: (amount: number) => Promise<void>;
}

// --- CONSTANTS ---
const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const CANVAS_PRESETS: {[key: string]: {w: number, h: number}} = { 'Instagram Post (1:1)': { w: 1080, h: 1080 }, 'Instagram Story (9:16)': { w: 1080, h: 1920 }, 'Facebook Post': { w: 1200, h: 630 }, 'Twitter Post': { w: 1600, h: 900 } };
const HANDLE_SIZE = 8, ROTATION_HANDLE_OFFSET = 20, SNAP_THRESHOLD = 5, DOUBLE_TAP_THRESHOLD = 300;
const FONT_CATEGORIES = [ { label: "Sans Serif", fonts: ["Poppins", "Montserrat", "Oswald", "Roboto", "Plus Jakarta Sans"] }, { label: "Serif", fonts: ["Playfair Display", "Lora"] }, { label: "Display & Script", fonts: ["Anton", "Bebas Neue", "Lobster", "Pacifico", "Satisfy", "Caveat"] } ];
const BLEND_MODES: BlendMode[] = ["source-over", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
const FILTER_PRESETS = [ { name: 'None', filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0 } }, { name: 'Vintage', filters: { brightness: 110, contrast: 90, saturate: 150, grayscale: 0 } }, { name: 'Sepia', filters: { brightness: 90, contrast: 110, saturate: 50, grayscale: 20 } }, { name: 'B&W', filters: { brightness: 100, contrast: 120, saturate: 100, grayscale: 100 } }, { name: 'Vibrant', filters: { brightness: 100, contrast: 110, saturate: 180, grayscale: 0 } } ];
const ELEMENTS_ASSETS = { Photos: [`${GITHUB_ASSETS_URL}sotoshop/photo1.jpg`, `${GITHUB_ASSETS_URL}sotoshop/photo2.jpg`], Elements: [`${GITHUB_ASSETS_URL}sotoshop/elem1.svg`, `${GITHUB_ASSETS_URL}sotoshop/elem2.svg`] };
const TEMPLATES = [ { name: 'Quote', json: { layers: [ { id: 1, type: 'shape', name: 'Background Box', x: 240, y: 440, width: 600, height: 200, rotation: 0, isVisible: true, isLocked: false, opacity: 100, shadow: { offsetX: 5, offsetY: 5, blur: 10, color: '#00000080' }, blendMode: 'source-over' as BlendMode, shape: 'rectangle' as ShapeType, fillColor: '#c026d3', strokeColor: '#000000', strokeWidth: 0 }, { id: 2, type: 'text', name: 'Quote Text', x: 270, y: 470, width: 540, height: 140, rotation: 0, isVisible: true, isLocked: false, opacity: 100, shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#00000000' }, blendMode: 'source-over' as BlendMode, content: '"Your brand is what other people say about you when you\'re not in the room."', font: 'Playfair Display', size: 40, color: '#FFFFFF', textAlign: 'center' as TextAlign } ], backgroundColor: '#18181b', width: 1080, height: 1080 } } ];
const BG_REMOVAL_COST = 2;
const AI_IMAGE_GEN_COST = 2;

// --- HISTORY REDUCER ---
const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  const { past, present, future } = state;
  switch (action.type) {
    case 'SET_STATE':
      if (action.withHistory) {
        return {
          past: [...past, present],
          present: { ...present, ...action.newState },
          future: [],
        };
      }
      return {
        ...state,
        present: { ...present, ...action.newState },
      };
    case 'UNDO':
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    case 'REDO':
       if (future.length === 0) return state;
       const next = future[0];
       const newFuture = future.slice(1);
       return {
         past: [...past, present],
         present: next,
         future: newFuture,
       };
    default:
        return state;
  }
};

// --- HELPER UI COMPONENTS ---
const PropertyInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, suffix?: string }> = ({ label, suffix, ...props }) => ( <div className="grid grid-cols-2 items-center gap-2"><label className="text-text-muted text-xs truncate">{label}</label><div className="relative"><input {...props} className={`w-full bg-background border border-border-main rounded p-1.5 text-sm ${suffix ? 'pr-6' : ''}`}/><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">{suffix}</span></div></div>);
const PropertyTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => ( <div><label className="block text-text-muted mb-1 text-xs">{label}</label><textarea {...props} className="w-full bg-background border border-border-main rounded py-2 px-2.5 text-sm"/></div>);
const PropertySelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }> = ({ label, children, ...props }) => ( <div><label className="block text-text-muted mb-1 text-xs">{label}</label><select {...props} className="w-full bg-background border border-border-main rounded py-2 px-2.5 text-sm">{children}</select></div>);
const PropertyColorInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => ( <div className="grid grid-cols-2 items-center gap-2"><label className="text-text-muted text-xs truncate">{label}</label><input type="color" {...props} className="w-full h-8 p-0.5 bg-background border border-border-main rounded" /></div>);
const PanelSection: React.FC<{title: string, children: React.ReactNode, defaultOpen?: boolean}> = ({title, children, defaultOpen = true}) => <details className="border-b border-border-main" open={defaultOpen}><summary className="font-bold text-text-header text-xs py-2 cursor-pointer uppercase tracking-wider">{title}</summary><div className="pb-3 space-y-3">{children}</div></details>
const rotatePoint = (point: {x:number, y:number}, center: {x:number, y:number}, angle: number) => { 
    const radians = angle * (Math.PI / 180);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const nx = (cos * (point.x - center.x)) + (sin * (point.y - center.y)) + center.x;
    const ny = (cos * (point.y - center.y)) - (sin * (point.x - center.x)) + center.y;
    return { x: nx, y: ny };
};

const NewDocumentModal: React.FC<{ onClose: () => void, onCreate: (w: number, h: number) => void, onCreateFromImage: () => void }> = ({ onClose, onCreate, onCreateFromImage }) => { /* ... */ return null; };

const DraggablePanel: React.FC<{ title: string, children: React.ReactNode, pos: {x:number, y:number}, onDragStart: (e: React.MouseEvent) => void }> = ({title, children, pos, onDragStart}) => (
    <div className="absolute w-64 bg-surface/90 backdrop-blur-md border border-border-main rounded-lg shadow-2xl flex flex-col z-10" style={{ left: pos.x, top: pos.y, touchAction: 'none' }}>
        <div onMouseDown={onDragStart} className="p-2 font-bold text-text-header border-b border-border-main cursor-move">{title}</div>
        <div className="p-3 overflow-y-auto max-h-[60vh]">{children}</div>
    </div>
);

// --- MAIN COMPONENT ---
const Sotoshop: React.FC<SotoshopProps> = ({ show, onClose, profile, deductCredits, setShowOutOfCreditsModal, addXp }) => {
    // Canvas & History State
    const [historyState, dispatch] = useReducer(historyReducer, { past: [], present: { layers: [], backgroundColor: '#18181b', width: 1080, height: 1080 }, future: [] });
    const { layers, backgroundColor, width, height } = historyState.present;
    
    // UI & Interaction State
    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    const [editingText, setEditingText] = useState<EditingText>(null);
    const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
    
    // Panel Visibility & Position
    const [panels, setPanels] = useState({
        layers: { visible: true, pos: { x: 20, y: 80 } },
        properties: { visible: true, pos: { x: window.innerWidth - 276, y: 80 } },
        elements: { visible: false, pos: { x: 20, y: 450 } },
    });
    
    // AI Modal State
    const [showAiGenerator, setShowAiGenerator] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const lastTap = useRef(0);

    // Derived State
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    
    // --- Core Logic ---
    const setState = useCallback((newState: Partial<CanvasState>, withHistory = true) => {
        dispatch({ type: 'SET_STATE', newState, withHistory });
    }, []);

    const addLayer = useCallback((type: Layer['type'], props: Partial<Layer> = {}) => {
        const newLayer: Layer = {
            id: Date.now(), type, name: `${type} ${layers.length + 1}`, x: (width / 2) - 100, y: (height / 2) - 50, width: 200, height: 100, rotation: 0,
            isVisible: true, isLocked: false, opacity: 100, shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#00000000' }, blendMode: 'source-over',
            ...(type === 'text' && { content: 'Teks Baru', font: 'Plus Jakarta Sans', size: 48, color: '#FFFFFF', textAlign: 'left' }),
            ...(type === 'image' && { image: new Image(), filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0 } }),
            ...(type === 'shape' && { shape: 'rectangle', fillColor: '#FFFFFF', strokeColor: '#000000', strokeWidth: 0 }),
            ...props,
        } as Layer;
        setState({ layers: [...layers, newLayer] });
        setSelectedLayerId(newLayer.id);
    }, [layers, width, height, setState]);
    
    const updateLayer = (id: number, props: Partial<Layer>, withHistory = true) => setState({ layers: layers.map(l => l.id === id ? { ...l, ...props } : l) }, withHistory);
    const deleteLayer = (id: number) => { setState({ layers: layers.filter(l => l.id !== id) }); if (selectedLayerId === id) setSelectedLayerId(null); };
    const moveLayer = (id: number, direction: 'up' | 'down') => { /* ... implementation ... */ };

    // --- Drawing Logic ---
    const redrawCanvas = useCallback(() => { /* ... implementation ... */ }, [layers, backgroundColor, width, height, selectedLayerId, zoom, pan]);
    useEffect(() => { const canvas = canvasRef.current; if (canvas) redrawCanvas(); }, [redrawCanvas]);
    
    // --- Interaction Handlers ---
    const handlePointerDown = (e: React.PointerEvent) => { /* ... implementation ... */ };
    const handlePointerMove = (e: React.PointerEvent) => { /* ... implementation ... */ };
    const handlePointerUp = (e: React.PointerEvent) => { /* ... implementation ... */ };
    const handleWheel = (e: React.WheelEvent) => { /* ... implementation ... */ };
    const handleDoubleClick = (e: React.MouseEvent) => { /* ... implementation ... */ };
    const handlePanelDragStart = (e: React.MouseEvent, panel: keyof typeof panels) => { /* ... implementation ... */ };

    // --- AI & Feature Handlers ---
    const handleGenerateAiImage = async () => { /* ... implementation ... */ };
    const handleRemoveBackground = async () => { /* ... implementation ... */ };
    const handleAlignment = (align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => { /* ... implementation ... */ };
    const handleAddElement = (url: string) => { /* ... implementation ... */ };
    const handleApplyTemplate = (templateJson: CanvasState) => setState(templateJson);

    // --- Render ---
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-background flex flex-col z-50 text-text-body" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        {/* Modals will go here */}
  
        {/* Header */}
        <header className="flex-shrink-0 flex justify-between items-center p-2 bg-surface border-b border-border-main">
          {/* Left: File actions */}
          <div className="flex items-center gap-2">
            <Button size="small" variant="secondary" onClick={onClose}>&larr; Keluar</Button>
            <Button size="small" variant="secondary" onClick={() => dispatch({ type: 'UNDO' })}>Undo</Button>
            <Button size="small" variant="secondary" onClick={() => dispatch({ type: 'REDO' })}>Redo</Button>
          </div>
          <h2 className="text-sm font-bold text-text-header">Sotoshop Editor</h2>
          {/* Right: Export */}
          <div className="flex items-center gap-2">
            <Button size="small" variant="splash">Export</Button>
          </div>
        </header>
  
        {/* Main Area */}
        <main className="flex-grow flex relative overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-grow flex items-center justify-center bg-black/50" onWheel={handleWheel} onPointerDown={handlePointerDown} onDoubleClick={handleDoubleClick}>
            <canvas ref={canvasRef} className="rounded-sm shadow-2xl" style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'center center' }} />
          </div>
  
          {/* Draggable Panels */}
          {panels.layers.visible && <DraggablePanel title="Layers" pos={panels.layers.pos} onDragStart={(e) => handlePanelDragStart(e, 'layers')}>{/* Layers content */}</DraggablePanel>}
          {panels.properties.visible && <DraggablePanel title="Properties" pos={panels.properties.pos} onDragStart={(e) => handlePanelDragStart(e, 'properties')}>{/* Properties content */}</DraggablePanel>}
          {panels.elements.visible && <DraggablePanel title="Elements" pos={panels.elements.pos} onDragStart={(e) => handlePanelDragStart(e, 'elements')}>{/* Elements content */}</DraggablePanel>}
        </main>
  
        {/* Bottom Toolbar */}
        <footer className="flex-shrink-0 flex justify-center items-center p-2 bg-surface border-t border-border-main">
            {/* Tools will go here */}
        </footer>
      </div>
    );
};

export default Sotoshop;
