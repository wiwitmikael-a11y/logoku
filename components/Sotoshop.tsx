// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './common/Button';

// --- TYPE DEFINITIONS ---
type Tool = 'select' | 'text' | 'shape';
type ShapeType = 'rectangle' | 'circle';

interface BaseLayer { id: number; type: 'text' | 'image' | 'shape'; x: number; y: number; width: number; height: number; rotation: number; isVisible: boolean; }
interface TextLayer extends BaseLayer { type: 'text'; content: string; font: string; size: number; color: string; }
interface ImageLayer extends BaseLayer { type: 'image'; image: HTMLImageElement; opacity: number; }
interface ShapeLayer extends BaseLayer { type: 'shape'; shape: ShapeType; fillColor: string; strokeColor: string; strokeWidth: number; }
type Layer = TextLayer | ImageLayer | ShapeLayer;

const FONT_FAMILIES = ['Plus Jakarta Sans', 'Bebas Neue', 'Caveat', 'Arial', 'Verdana', 'Times New Roman'];
const CANVAS_PRESETS = { 'IG Post (1:1)': { w: 1080, h: 1080 }, 'IG Story (9:16)': { w: 1080, h: 1920 }, 'Custom': {w: 512, h: 512} };

// --- HELPER COMPONENTS ---
const ToolButton: React.FC<{ title: string; active: boolean; onClick: () => void; children: React.ReactNode }> = ({ title, active, onClick, children }) => (
    <button title={title} onClick={onClick} className={`w-14 h-14 flex items-center justify-center rounded-md transition-colors ${active ? 'bg-splash text-white' : 'bg-background/50 hover:bg-border-light text-text-muted'}`}>
        {children}
    </button>
);
const PropertyInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div><label className="block text-text-muted mb-1 text-xs">{label}</label><input {...props} className="w-full bg-background border border-border-main rounded-md p-1.5 text-sm"/></div>
);
// FIX: Added a dedicated component for textarea properties to resolve type conflicts with 'as' prop.
const PropertyTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div><label className="block text-text-muted mb-1 text-xs">{label}</label><textarea {...props} className="w-full bg-background border border-border-main rounded-md p-1.5 text-sm"/></div>
);
const PropertyColorInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div><label className="block text-text-muted mb-1 text-xs">{label}</label><input {...props} className="w-full h-9 p-0.5 bg-background border border-border-main rounded-md" /></div>
);

// --- MAIN COMPONENT ---
const Sotoshop: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [canvasState, setCanvasState] = useState<'setup' | 'editing'>('setup');

    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>('select');
    
    const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
    const [backgroundColor, setBackgroundColor] = useState('#101012');
    
    const [isDragging, setIsDragging] = useState(false);
    const dragStartOffset = useRef({ x: 0, y: 0 });

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        layers.forEach(layer => {
            if (!layer.isVisible) return;
            ctx.save();
            ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
            
            if (layer.type === 'image') {
                ctx.globalAlpha = layer.opacity / 100;
                ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
                ctx.globalAlpha = 1;
            } else if (layer.type === 'text') {
                ctx.font = `${layer.size}px ${layer.font}`;
                ctx.fillStyle = layer.color;
                ctx.textBaseline = 'top';
                ctx.fillText(layer.content, layer.x, layer.y);
            } else if (layer.type === 'shape') {
                ctx.fillStyle = layer.fillColor;
                ctx.strokeStyle = layer.strokeColor;
                ctx.lineWidth = layer.strokeWidth;
                if (layer.shape === 'rectangle') {
                    ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
                    if (layer.strokeWidth > 0) ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
                } else if (layer.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, 0, 2 * Math.PI);
                    ctx.fill();
                    if (layer.strokeWidth > 0) ctx.stroke();
                }
            }
            ctx.restore();
            
            if (layer.id === selectedLayerId) {
                ctx.strokeStyle = 'rgb(var(--c-splash))';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 3]);
                ctx.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4);
                ctx.setLineDash([]);
            }
        });
    }, [layers, selectedLayerId, backgroundColor]);

    useEffect(() => {
        if (show && canvasState === 'editing') redrawCanvas();
    }, [show, layers, selectedLayerId, redrawCanvas, canvasState]);
    
    useEffect(() => { if (!show) setCanvasState('setup'); }, [show]);

    const handleCreateCanvas = (preset: {w: number, h: number}) => {
        setCanvasSize({ width: preset.w, height: preset.h });
        setLayers([]);
        const canvas = canvasRef.current;
        if(canvas) {
            canvas.width = preset.w;
            canvas.height = preset.h;
        }
        setCanvasState('editing');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const newImageLayer: ImageLayer = {
                    id: Date.now(), type: 'image', image: img, x: 20, y: 20, 
                    width: img.width, height: img.height, rotation: 0, opacity: 100, isVisible: true
                };
                setLayers(prev => [...prev, newImageLayer]);
                if (canvasState === 'setup') {
                    handleCreateCanvas({w: img.width, h: img.height});
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const addLayer = (type: 'text' | 'shape', shapeType?: ShapeType) => {
        let newLayer: Layer;
        const common = { id: Date.now(), x: 50, y: 50, rotation: 0, isVisible: true };
        if (type === 'text') {
            newLayer = { ...common, type: 'text', content: 'Teks Baru', font: 'Plus Jakarta Sans', size: 48, color: '#FFFFFF', width: 200, height: 50 } as TextLayer;
        } else {
            newLayer = { ...common, type: 'shape', shape: shapeType!, fillColor: '#c026d3', strokeColor: '#FFFFFF', strokeWidth: 0, width: 100, height: 100 } as ShapeLayer;
        }
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    const getCanvasCoords = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        const coords = getCanvasCoords(e);
        let found = false;
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.isVisible && coords.x >= layer.x && coords.x <= layer.x + layer.width && coords.y >= layer.y && coords.y <= layer.y + layer.height) {
                setSelectedLayerId(layer.id);
                setIsDragging(true);
                dragStartOffset.current = { x: coords.x - layer.x, y: coords.y - layer.y };
                found = true;
                return;
            }
        }
        if (!found) setSelectedLayerId(null);
    };
    
    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || selectedLayerId === null) return;
        const coords = getCanvasCoords(e);
        setLayers(prev => prev.map(layer => 
          layer.id === selectedLayerId ? { ...layer, x: coords.x - dragStartOffset.current.x, y: coords.y - dragStartOffset.current.y } : layer
        ));
    };

    // FIX: Cast the result to Layer to resolve complex discriminated union type inference issues.
    const updateLayer = (id: number, props: Partial<Layer>) => {
        setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...props } as Layer : l)));
    };
    
    const moveLayer = (id: number, direction: 'up' | 'down') => {
        const index = layers.findIndex(l => l.id === id);
        if (index === -1) return;
        const newLayers = [...layers];
        const targetIndex = direction === 'up' ? Math.min(layers.length - 1, index + 1) : Math.max(0, index - 1);
        if (index === targetIndex) return;
        [newLayers[index], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[index]];
        setLayers(newLayers);
    };
    
    const deleteLayer = (id: number) => {
        setLayers(prev => prev.filter(l => l.id !== id));
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const handleDownload = () => {
        setSelectedLayerId(null); // Deselect before downloading to remove selection box
        setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `sotoshop-export-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }, 100);
    };

    const selectedLayer = layers.find(l => l.id === selectedLayerId);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex flex-col z-50 p-4 animate-content-fade-in" role="dialog">
            {canvasState === 'setup' ? (
                <div className="m-auto bg-surface p-8 rounded-lg max-w-lg w-full text-center">
                    <h2 className="text-2xl font-bold text-splash mb-4" style={{fontFamily: 'var(--font-hand)'}}>Mulai Ngoprek di Sotoshop</h2>
                    <p className="text-text-muted mb-6">Mau mulai dari mana, Juragan?</p>
                    <div className="flex flex-col gap-4">
                        <Button onClick={() => fileInputRef.current?.click()} variant="primary" size="large" className="w-full">Upload Gambar</Button>
                        <div className="flex items-center gap-2"><hr className="flex-grow border-border-main"/><span className="text-text-muted text-sm">ATAU</span><hr className="flex-grow border-border-main"/></div>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(CANVAS_PRESETS).map(([name, dims]) => <Button key={name} onClick={() => handleCreateCanvas(dims)} variant="secondary">{name}</Button>)}
                        </div>
                    </div>
                     <Button onClick={onClose} variant="secondary" size="small" className="mt-8">Batal</Button>
                     <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
            ) : (
                <>
                    <header className="flex-shrink-0 flex justify-between items-center p-2 bg-surface/10 rounded-t-lg">
                        <h2 className="text-xl font-bold text-splash" style={{fontFamily: 'var(--font-hand)'}}>Sotoshop</h2>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleDownload} variant="splash" size="small">Unduh</Button>
                            <Button onClick={onClose} variant="secondary" size="small">Tutup</Button>
                        </div>
                    </header>
                    <div className="flex-grow flex gap-4 mt-4 overflow-hidden">
                        {/* Toolbar */}
                        <aside className="w-20 flex-shrink-0 flex flex-col items-center gap-2 bg-surface/10 p-2 rounded-lg">
                            <ToolButton title="Pilih & Geser" active={activeTool === 'select'} onClick={() => setActiveTool('select')}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3.5m0 0a1.5 1.5 0 01-3 0V11" /></svg></ToolButton>
                            <ToolButton title="Tambah Teks" active={false} onClick={() => addLayer('text')}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v18M6.6 14h5.8M6.4 7.5h6.2" /></svg></ToolButton>
                            <ToolButton title="Tambah Kotak" active={false} onClick={() => addLayer('shape', 'rectangle')}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3z" /></svg></ToolButton>
                            <ToolButton title="Tambah Lingkaran" active={false} onClick={() => addLayer('shape', 'circle')}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></ToolButton>
                            <ToolButton title="Upload Gambar" active={false} onClick={() => fileInputRef.current?.click()}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></ToolButton>
                        </aside>

                        <main className="flex-grow flex items-center justify-center bg-black/50 overflow-auto rounded-lg"><canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)} /></main>
                        
                        <aside className="w-72 flex-shrink-0 bg-surface/10 p-3 rounded-lg flex flex-col gap-4 text-sm">
                            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                               {selectedLayer ? (
                                    <>
                                        <h3 className="font-bold text-primary">Properties</h3>
                                        {selectedLayer.type === 'text' && (<div className="space-y-3">
                                            {/* FIX: Replaced PropertyInput with as="textarea" with the new PropertyTextarea component. */}
                                            <PropertyTextarea label="Konten" value={selectedLayer.content} onChange={(e: any) => updateLayer(selectedLayerId!, { content: e.target.value })} rows={3} />
                                            <div><label className="block text-text-muted mb-1 text-xs">Font</label><select value={selectedLayer.font} onChange={e => updateLayer(selectedLayerId!, { font: e.target.value })} className="w-full bg-background border border-border-main rounded-md p-1.5 text-sm"><option value="">Pilih Font</option>{FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                                            <div className="grid grid-cols-2 gap-2"><PropertyInput label="Ukuran" type="number" value={selectedLayer.size} onChange={(e: any) => updateLayer(selectedLayerId!, { size: parseInt(e.target.value) || 12 })} /><PropertyColorInput label="Warna" type="color" value={selectedLayer.color} onChange={(e: any) => updateLayer(selectedLayerId!, { color: e.target.value })} /></div>
                                        </div>)}
                                        {selectedLayer.type === 'image' && (<div className="space-y-3">
                                            <PropertyInput label="Opacity" type="range" min="0" max="100" value={selectedLayer.opacity} onChange={(e: any) => updateLayer(selectedLayerId!, { opacity: parseInt(e.target.value) })} />
                                        </div>)}
                                         {selectedLayer.type === 'shape' && (<div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2"><PropertyColorInput label="Warna Isi" type="color" value={selectedLayer.fillColor} onChange={(e: any) => updateLayer(selectedLayerId!, { fillColor: e.target.value })} /><PropertyColorInput label="Warna Garis" type="color" value={selectedLayer.strokeColor} onChange={(e: any) => updateLayer(selectedLayerId!, { strokeColor: e.target.value })} /></div>
                                            <PropertyInput label="Tebal Garis" type="number" min="0" value={selectedLayer.strokeWidth} onChange={(e: any) => updateLayer(selectedLayerId!, { strokeWidth: parseInt(e.target.value) })} />
                                        </div>)}
                                        <div className="space-y-3 pt-3 border-t border-border-main">
                                             <PropertyInput label="Lebar (W)" type="number" value={Math.round(selectedLayer.width)} onChange={(e: any) => updateLayer(selectedLayerId!, { width: parseInt(e.target.value) })} />
                                             <PropertyInput label="Tinggi (H)" type="number" value={Math.round(selectedLayer.height)} onChange={(e: any) => updateLayer(selectedLayerId!, { height: parseInt(e.target.value) })} />
                                        </div>
                                    </>
                               ) : (
                                    <>
                                        <h3 className="font-bold text-primary">Canvas</h3>
                                        <PropertyColorInput label="Background Color" type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} />
                                    </>
                               )}
                            </div>
                            <div className="flex-shrink-0 border-t border-border-main pt-3">
                                <h3 className="font-bold text-text-header mb-2">Layers</h3>
                                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                    {[...layers].reverse().map(layer => (
                                        <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} className={`p-2 rounded-md cursor-pointer flex items-center gap-2 ${selectedLayerId === layer.id ? 'bg-splash/20' : 'bg-background/50 hover:bg-border-main'}`}>
                                            <span className="flex-grow truncate">{layer.type === 'text' ? `T: ${layer.content}` : layer.type === 'shape' ? `B: ${layer.shape}` : '🖼️ Gambar'}</span>
                                            <button onClick={(e) => {e.stopPropagation(); moveLayer(layer.id, 'up')}} title="Naik"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg></button>
                                            <button onClick={(e) => {e.stopPropagation(); moveLayer(layer.id, 'down')}} title="Turun"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></button>
                                            <button onClick={(e) => {e.stopPropagation(); updateLayer(layer.id, { isVisible: !layer.isVisible })}} title="Sembunyikan">{layer.isVisible ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>}</button>
                                            <button onClick={(e) => {e.stopPropagation(); deleteLayer(layer.id)}} title="Hapus"><svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sotoshop;
