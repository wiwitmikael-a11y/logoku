// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';

// --- TYPE DEFINITIONS ---
type Tool = 'select' | 'text' | 'shape' | 'eyedropper' | 'hand';
type ShapeType = 'rectangle' | 'circle';
type TextAlign = 'left' | 'center' | 'right';
type Handle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'rot';

interface BaseLayer { id: number; type: 'text' | 'image' | 'shape'; name: string; x: number; y: number; width: number; height: number; rotation: number; isVisible: boolean; isLocked: boolean; opacity: number; shadowColor: string; shadowBlur: number; shadowOffsetX: number; shadowOffsetY: number; strokeColor: string; strokeWidth: number;}
interface TextLayer extends BaseLayer { type: 'text'; content: string; font: string; size: number; color: string; textAlign: TextAlign; lineHeight: number; letterSpacing: number; }
interface ImageLayer extends BaseLayer { type: 'image'; image: HTMLImageElement; }
interface ShapeLayer extends BaseLayer { type: 'shape'; shape: ShapeType; fillColor: string; }
type Layer = TextLayer | ImageLayer | ShapeLayer;

type CanvasState = { layers: Layer[]; backgroundColor: string; width: number; height: number; };
type HistoryState = { past: CanvasState[]; present: CanvasState; future: CanvasState[]; };

type HistoryAction = 
    | { type: 'SET_STATE'; newState: Partial<CanvasState>, withHistory: boolean }
    | { type: 'UNDO' }
    | { type: 'REDO' };

const FONT_FAMILIES = ['Plus Jakarta Sans', 'Bebas Neue', 'Caveat', 'Arial', 'Verdana', 'Times New Roman'];
const CANVAS_PRESETS: {[key: string]: {w: number, h: number}} = { 'IG Post (1:1)': { w: 1080, h: 1080 }, 'IG Story (9:16)': { w: 1080, h: 1920 }, 'FB Post': { w: 1200, h: 630 } };

// --- HISTORY REDUCER ---
const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
    const { past, present, future } = state;
    switch (action.type) {
        case 'SET_STATE':
            if (!action.withHistory) {
                return { ...state, present: { ...present, ...action.newState } };
            }
            // Prevent pushing identical states to history
            if (JSON.stringify(present) === JSON.stringify({ ...present, ...action.newState })) {
                return state;
            }
            return { past: [...past, present], present: { ...present, ...action.newState }, future: [] };
        case 'UNDO':
            if (past.length === 0) return state;
            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);
            return { past: newPast, present: previous, future: [present, ...future] };
        case 'REDO':
            if (future.length === 0) return state;
            const next = future[0];
            const newFuture = future.slice(1);
            return { past: [...past, present], present: next, future: newFuture };
        default: return state;
    }
};

// --- HELPER UI COMPONENTS ---
const PropertyInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => ( <div className="grid grid-cols-2 items-center gap-2"><label className="text-text-muted text-xs truncate">{label}</label><input {...props} className="w-full bg-background border border-border-main rounded p-1 text-sm"/></div>);
const PropertyTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => ( <div><label className="block text-text-muted mb-1 text-xs">{label}</label><textarea {...props} className="w-full bg-background border border-border-main rounded p-1.5 text-sm"/></div>);
const PropertySelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, ...props }) => ( <div><label className="block text-text-muted mb-1 text-xs">{label}</label><select {...props} className="w-full bg-background border border-border-main rounded p-1.5 text-sm"/></div>);
const PropertyColorInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => ( <div className="grid grid-cols-2 items-center gap-2"><label className="text-text-muted text-xs truncate">{label}</label><input type="color" {...props} className="w-full h-8 p-0.5 bg-background border border-border-main rounded" /></div>);
const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { title: string, isActive?: boolean, children: React.ReactNode }> = ({ title, isActive, children, ...props }) => <button title={title} {...props} className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${isActive ? 'bg-splash text-white' : 'text-text-muted hover:bg-border-light'}`}>{children}</button>;

// --- MAIN COMPONENT ---
const Sotoshop: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [canvasState, setCanvasState] = useState<'setup' | 'editing'>('setup');
    const [preset, setPreset] = useState<{w: number, h: number}>(CANVAS_PRESETS['IG Post (1:1)']);
    const [bgColor, setBgColor] = useState('#101012');

    const [history, dispatchHistory] = useReducer(historyReducer, { past: [], present: { layers: [], backgroundColor: '#101012', width: 1080, height: 1080 }, future: [] });
    const { present: currentCanvas, past, future } = history;
    const { layers, backgroundColor, width, height } = currentCanvas;

    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>('select');
    
    const [viewTransform, setViewTransform] = useState({ zoom: 0.5, pan: { x: 0, y: 0 } });
    const isSpacePressed = useRef(false);
    const isPanning = useRef(false);
    const panStart = useRef({x: 0, y: 0});

    const setState = (newState: Partial<CanvasState>, withHistory = true) => dispatchHistory({ type: 'SET_STATE', newState, withHistory });
    const undo = () => { playSound('select'); dispatchHistory({ type: 'UNDO' }); };
    const redo = () => { playSound('select'); dispatchHistory({ type: 'REDO' }); };
    
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const container = canvasContainerRef.current;
        if (!canvas || !ctx || !container) return;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const patternCanvas = document.createElement('canvas'); const pctx = patternCanvas.getContext('2d'); patternCanvas.width = 20; patternCanvas.height = 20;
        if(pctx){ pctx.fillStyle = '#2a2a2e'; pctx.fillRect(0,0,20,20); pctx.fillStyle = '#202022'; pctx.fillRect(0,0,10,10); pctx.fillRect(10,10,10,10); }
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        if(pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        ctx.translate(viewTransform.pan.x, viewTransform.pan.y);
        ctx.scale(viewTransform.zoom, viewTransform.zoom);
        ctx.fillStyle = backgroundColor;
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
        ctx.fillRect(0, 0, width, height);
        ctx.shadowBlur = 0;

        [...layers].forEach(layer => {
            if (!layer.isVisible) return;
            ctx.save(); ctx.globalAlpha = layer.opacity / 100;
            ctx.shadowColor = layer.shadowColor; ctx.shadowBlur = layer.shadowBlur; ctx.shadowOffsetX = layer.shadowOffsetX; ctx.shadowOffsetY = layer.shadowOffsetY;
            ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
            
            if (layer.type === 'text') {
                ctx.font = `${layer.size}px ${layer.font}`;
                ctx.fillStyle = layer.color;
                ctx.textBaseline = 'top';
                ctx.textAlign = layer.textAlign;
                const drawX = layer.textAlign === 'center' ? layer.x + layer.width/2 : layer.textAlign === 'right' ? layer.x + layer.width : layer.x;
                ctx.fillText(layer.content, drawX, layer.y);
            } else if (layer.type === 'shape') {
                ctx.fillStyle = layer.fillColor;
                if(layer.shape === 'rectangle') ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
                else { ctx.beginPath(); ctx.arc(layer.x + layer.width/2, layer.y + layer.height/2, layer.width/2, 0, 2 * Math.PI); ctx.fill(); }
            }
            ctx.restore();
        });
        
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (selectedLayer) {
            ctx.strokeStyle = 'rgb(var(--c-splash))'; ctx.lineWidth = 2 / viewTransform.zoom; ctx.setLineDash([6 / viewTransform.zoom, 3 / viewTransform.zoom]);
            ctx.strokeRect(selectedLayer.x, selectedLayer.y, selectedLayer.width, selectedLayer.height);
            ctx.setLineDash([]);
        }
        ctx.restore();
    }, [layers, selectedLayerId, backgroundColor, width, height, viewTransform]);

    useEffect(() => { if (show && canvasState === 'editing') redrawCanvas(); }, [show, redrawCanvas, canvasState]);

    const updateLayer = (id: number, props: Partial<Layer>, withHistory = true) => {
        const newLayers = layers.map(l => (l.id === id ? { ...l, ...props } : l));
        setState({ layers: newLayers }, withHistory);
    };

    // FIX: Explicitly typing the created layer objects before assigning them to the `newLayer`
    // variable. This resolves a TypeScript error where the compiler failed to correctly
    // infer the object literal type as a member of the `Layer` discriminated union.
    const addLayer = (type: 'text' | 'shape', shapeType?: ShapeType) => {
        let newLayer: Layer;
        const common = { id: Date.now(), x: 50, y: 50, rotation: 0, isVisible: true, isLocked: false, opacity: 100, shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, strokeColor: '#000000', strokeWidth: 0 };
        if (type === 'text') {
            const textLayer: TextLayer = { ...common, name: "Teks Baru", type: 'text', content: 'Teks Baru', font: 'Plus Jakarta Sans', size: 48, color: '#FFFFFF', width: 200, height: 50, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0 };
            newLayer = textLayer;
        } else {
            const shapeLayer: ShapeLayer = { ...common, name: "Bentuk Baru", type: 'shape', shape: shapeType!, fillColor: '#c026d3', width: 100, height: 100 };
            newLayer = shapeLayer;
        }
        setState({ layers: [...layers, newLayer] }); setSelectedLayerId(newLayer.id);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
            if (e.code === 'Space' && !e.repeat) { e.preventDefault(); isSpacePressed.current = true; }
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId !== null) deleteLayer(selectedLayerId);
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') isSpacePressed.current = false; };
        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [selectedLayerId, layers]);

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isSpacePressed.current || activeTool === 'hand') {
            isPanning.current = true;
            panStart.current = { x: e.clientX, y: e.clientY };
            return;
        }
        const { offsetX, offsetY } = e.nativeEvent;
        const worldX = (offsetX - viewTransform.pan.x) / viewTransform.zoom;
        const worldY = (offsetY - viewTransform.pan.y) / viewTransform.zoom;

        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (worldX >= layer.x && worldX <= layer.x + layer.width && worldY >= layer.y && worldY <= layer.y + layer.height) {
                setSelectedLayerId(layer.id);
                return;
            }
        }
        setSelectedLayerId(null);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPanning.current) {
            const dx = e.clientX - panStart.current.x; const dy = e.clientY - panStart.current.y;
            setViewTransform(prev => ({ ...prev, pan: { x: prev.pan.x + dx, y: prev.pan.y + dy } }));
            panStart.current = { x: e.clientX, y: e.clientY };
        }
    };
    const handleCanvasMouseUp = () => isPanning.current = false;
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const { deltaY, clientX, clientY } = e;
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const zoomFactor = 1.1;
        const newZoom = deltaY < 0 ? viewTransform.zoom * zoomFactor : viewTransform.zoom / zoomFactor;
        const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
        const zoomRatio = clampedZoom / viewTransform.zoom;

        const newPanX = mouseX - (mouseX - viewTransform.pan.x) * zoomRatio;
        const newPanY = mouseY - (mouseY - viewTransform.pan.y) * zoomRatio;

        setViewTransform({ zoom: clampedZoom, pan: { x: newPanX, y: newPanY } });
    };

    const handleCreateCanvas = () => {
        setState({ layers: [], backgroundColor: bgColor, width: preset.w, height: preset.h });
        setCanvasState('editing');
        const container = canvasContainerRef.current;
        if(container) {
            const zoomX = container.clientWidth / (preset.w + 100);
            const zoomY = container.clientHeight / (preset.h + 100);
            const newZoom = Math.min(zoomX, zoomY, 1);
            setViewTransform({ zoom: newZoom, pan: {x: (container.clientWidth - preset.w * newZoom)/2, y: (container.clientHeight - preset.h * newZoom)/2 }});
        }
    };
    
    const deleteLayer = (id: number) => {
        setState({ layers: layers.filter(l => l.id !== id) });
        if(selectedLayerId === id) setSelectedLayerId(null);
    };
    
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-background flex flex-col z-50 text-text-body" role="dialog">
            {canvasState === 'setup' ? (
                 <div className="m-auto flex flex-col items-center gap-6 p-8 bg-surface rounded-lg w-full max-w-md">
                     <h2 className="text-2xl font-bold text-splash" style={{fontFamily: 'var(--font-hand)'}}>Setup Kanvas Sotoshop</h2>
                     <div className="w-full space-y-4">
                        <PropertySelect label="Preset Ukuran" onChange={e => setPreset(CANVAS_PRESETS[e.target.value])}>
                            {Object.keys(CANVAS_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                        </PropertySelect>
                        <div className="grid grid-cols-2 gap-4">
                           <PropertyInput label="Lebar (px)" type="number" value={preset.w} onChange={e => setPreset({...preset, w: +e.target.value})} />
                           <PropertyInput label="Tinggi (px)" type="number" value={preset.h} onChange={e => setPreset({...preset, h: +e.target.value})} />
                        </div>
                        <PropertyColorInput label="Warna Background" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                     </div>
                     <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={onClose}>Batal</Button>
                        <Button variant="splash" onClick={handleCreateCanvas}>Buat Kanvas</Button>
                     </div>
                 </div>
            ) : (
                <>
                    <header className="flex-shrink-0 flex justify-between items-center p-1 bg-surface border-b border-border-main">
                        <div className="flex items-center gap-1"><h2 className="text-lg font-bold text-splash px-2" style={{fontFamily: 'var(--font-hand)'}}>Sotoshop</h2><Button size="small" variant="secondary" onClick={undo} disabled={past.length === 0}>Undo</Button><Button size="small" variant="secondary" onClick={redo} disabled={future.length === 0}>Redo</Button></div>
                        <div className="flex items-center gap-2"><span className="text-xs text-text-muted">{Math.round(viewTransform.zoom * 100)}%</span><Button size="small" variant="splash" onClick={() => {}}>Ekspor</Button><Button size="small" variant="secondary" onClick={onClose}>Tutup</Button></div>
                    </header>
                    <div className="flex-grow flex overflow-hidden">
                        <aside className="w-14 flex-shrink-0 flex flex-col items-center gap-1 bg-surface p-1 border-r border-border-main"><IconButton title="Select" onClick={() => setActiveTool('select')} isActive={activeTool === 'select'}>S</IconButton><IconButton title="Text" onClick={() => addLayer('text')} isActive={activeTool === 'text'}>T</IconButton><IconButton title="Rectangle" onClick={() => addLayer('shape', 'rectangle')} isActive={activeTool === 'shape'}>■</IconButton><IconButton title="Hand / Pan" onClick={() => setActiveTool('hand')} isActive={activeTool === 'hand'}>H</IconButton></aside>
                        <aside className="w-60 flex-shrink-0 flex flex-col bg-surface p-2 border-r border-border-main"><h3 className="font-bold text-text-header text-sm mb-2 px-1">Layers</h3><div className="flex-grow overflow-y-auto space-y-1">{[...layers].reverse().map(layer => (<div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} className={`p-2 rounded cursor-pointer flex items-center gap-2 ${selectedLayerId === layer.id ? 'bg-splash/20' : 'hover:bg-background'}`}><span className="text-xs">{layer.type==='text' ? 'T' : '■'}</span><span className="text-xs flex-grow truncate">{layer.name}</span><button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { isVisible: !layer.isVisible })}}>{layer.isVisible ? '👁️' : '🙈'}</button></div>))}</div></aside>
                        <main ref={canvasContainerRef} onWheel={handleWheel} className="flex-grow flex items-center justify-center bg-background overflow-hidden" style={{ cursor: isSpacePressed.current || isPanning.current || activeTool === 'hand' ? 'grabbing' : 'default' }}><canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} /></main>
                        <aside className="w-64 flex-shrink-0 bg-surface p-3 border-l border-border-main overflow-y-auto text-sm"><h3 className="font-bold text-text-header text-sm mb-3">Properties</h3>
                            {selectedLayer ? (
                                <div className="space-y-3">
                                  <PropertyInput label="Name" value={selectedLayer.name} onChange={e => updateLayer(selectedLayer.id, { name: e.target.value })} />
                                  <div className="grid grid-cols-2 gap-2"><PropertyInput label="X" type="number" value={Math.round(selectedLayer.x)} onChange={e => updateLayer(selectedLayer.id, { x: +e.target.value }, false)} /><PropertyInput label="Y" type="number" value={Math.round(selectedLayer.y)} onChange={e => updateLayer(selectedLayer.id, { y: +e.target.value }, false)} /><PropertyInput label="W" type="number" value={Math.round(selectedLayer.width)} onChange={e => updateLayer(selectedLayer.id, { width: +e.target.value }, false)} /><PropertyInput label="H" type="number" value={Math.round(selectedLayer.height)} onChange={e => updateLayer(selectedLayer.id, { height: +e.target.value }, false)} /></div>
                                  <PropertyInput label="Rotation" type="range" min="-180" max="180" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: +e.target.value }, false)} />
                                  {selectedLayer.type === 'text' && (<div className="space-y-3 pt-3 border-t border-border-main"><PropertyTextarea label="Content" value={selectedLayer.content} onChange={e => updateLayer(selectedLayer.id, { content: e.target.value })}/><PropertySelect label="Font" value={selectedLayer.font} onChange={e => updateLayer(selectedLayer.id, { font: e.target.value })}>{FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}</PropertySelect><div className="grid grid-cols-2 gap-2"><PropertyInput label="Size" type="number" value={selectedLayer.size} onChange={e => updateLayer(selectedLayer.id, { size: +e.target.value })} /><PropertyColorInput label="Color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} /></div></div>)}
                                  {selectedLayer.type === 'shape' && (<div className="space-y-3 pt-3 border-t border-border-main"><PropertyColorInput label="Fill" value={selectedLayer.fillColor} onChange={e => updateLayer(selectedLayer.id, { fillColor: e.target.value })} /></div>)}
                                  <div className="space-y-3 pt-3 border-t border-border-main"><h4 className="text-text-muted text-xs font-bold">EFFECTS</h4><PropertyInput label="Opacity" type="range" min="0" max="100" value={selectedLayer.opacity} onChange={e => updateLayer(selectedLayer.id, { opacity: +e.target.value }, false)} /></div>
                                </div>
                            ) : (<div><h4 className="font-bold text-text-header text-xs mb-2">Canvas</h4><PropertyColorInput label="Background" value={backgroundColor} onChange={e => setState({ backgroundColor: e.target.value })}/></div>)}
                        </aside>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sotoshop;
