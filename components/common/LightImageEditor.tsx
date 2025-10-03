// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './Button';

interface Props {
  show: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

type Tool = 'select' | 'text' | 'crop' | 'filters';
type CanvasObject = {
  id: number;
  type: 'text';
  content: string;
  x: number;
  y: number;
  font: string;
  size: number;
  color: string;
  width?: number; // Calculated width for selection box
};
type Filters = { brightness: number; contrast: number; saturate: number; grayscale: number; };

const FONT_FAMILES = ['Plus Jakarta Sans', 'Bebas Neue', 'Caveat', 'Arial', 'Verdana', 'Times New Roman', 'Courier New'];

const LightImageEditor: React.FC<Props> = ({ show, imageUrl, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Redraw canvas whenever state changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply filters and draw image
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%)`;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none'; // Reset filters for drawing objects over the image

    // Draw objects
    objects.forEach(obj => {
      ctx.font = `${obj.size}px ${obj.font}`;
      ctx.fillStyle = obj.color;
      ctx.textBaseline = 'top';
      ctx.fillText(obj.content, obj.x, obj.y);

      // Draw selection box if selected
      if (obj.id === selectedObjectId) {
        const textMetrics = ctx.measureText(obj.content);
        const padding = 5;
        const rectX = obj.x - padding;
        const rectY = obj.y - padding;
        const rectW = textMetrics.width + (padding * 2);
        const rectH = obj.size + (padding * 2);
        ctx.strokeStyle = 'rgb(var(--c-splash))';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.setLineDash([]);
      }
    });
  }, [objects, filters, selectedObjectId]);
  
  // Load image into canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!show || !imageUrl || !canvas) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
        imageRef.current = img;
        // Resize canvas to image dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        setObjects([]);
        setFilters({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0 });
        redrawCanvas();
    };
  }, [show, imageUrl, redrawCanvas]);
  
  useEffect(() => {
    if(show) redrawCanvas();
  }, [objects, filters, selectedObjectId, redrawCanvas, show]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'text') return;
    const { offsetX, offsetY } = e.nativeEvent;
    
    // Check if clicking on an object
    for (const obj of [...objects].reverse()) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        ctx.font = `${obj.size}px ${obj.font}`;
        const textMetrics = ctx.measureText(obj.content);
        if (offsetX >= obj.x && offsetX <= obj.x + textMetrics.width && offsetY >= obj.y && offsetY <= obj.y + obj.size) {
            setSelectedObjectId(obj.id);
            setIsDragging(true);
            setDragStart({ x: offsetX - obj.x, y: offsetY - obj.y });
            return;
        }
    }
    // If no object is clicked, deselect
    setSelectedObjectId(null);
  };
  
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || selectedObjectId === null) return;
    const { offsetX, offsetY } = e.nativeEvent;
    
    setObjects(prev => prev.map(obj => 
        obj.id === selectedObjectId 
            ? { ...obj, x: offsetX - dragStart.x, y: offsetY - dragStart.y }
            : obj
    ));
  };

  const handleCanvasMouseUp = () => setIsDragging(false);
  
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'text') return;
    const { offsetX, offsetY } = e.nativeEvent;
    const newText: CanvasObject = {
      id: Date.now(),
      type: 'text',
      content: 'Teks Baru',
      x: offsetX,
      y: offsetY,
      font: 'Plus Jakarta Sans',
      size: 48,
      color: '#FFFFFF'
    };
    setObjects(prev => [...prev, newText]);
    setSelectedObjectId(newText.id);
    setActiveTool('select'); // Switch to select tool to allow moving
  };
  
  const updateSelectedObject = (props: Partial<CanvasObject>) => {
    setObjects(prev => prev.map(obj => 
        obj.id === selectedObjectId ? { ...obj, ...props } : obj
    ));
  };
  
  const deleteSelectedObject = () => {
    if (selectedObjectId === null) return;
    setObjects(prev => prev.filter(obj => obj.id !== selectedObjectId));
    setSelectedObjectId(null);
  };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  const selectedObject = objects.find(o => o.id === selectedObjectId);
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex flex-col z-50 p-4" role="dialog" aria-modal="true">
      {/* Header */}
      <header className="flex-shrink-0 flex justify-between items-center p-2 bg-surface/10 rounded-t-lg">
        <h2 className="text-xl font-bold text-primary">Editor Gambar</h2>
        <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="splash" size="small">Unduh Gambar</Button>
            <Button onClick={onClose} variant="secondary" size="small">Tutup Editor</Button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-grow flex gap-4 mt-4 overflow-hidden">
        {/* Toolbar */}
        <aside className="w-16 flex-shrink-0 flex flex-col items-center gap-2 bg-surface/10 p-2 rounded-lg">
           {(['select', 'text', 'filters'] as Tool[]).map(tool => (
               <button 
                key={tool}
                title={tool.charAt(0).toUpperCase() + tool.slice(1)}
                onClick={() => setActiveTool(tool)}
                className={`w-12 h-12 flex items-center justify-center rounded-md transition-colors ${activeTool === tool ? 'bg-splash text-white' : 'bg-background/50 hover:bg-border-light text-text-muted'}`}
               >
                {tool === 'select' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3.5m0 0a1.5 1.5 0 01-3 0V11" /></svg>}
                {tool === 'text' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v18M6.6 14h5.8M6.4 7.5h6.2" /></svg>}
                {tool === 'filters' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
               </button>
           ))}
        </aside>

        {/* Canvas Area */}
        <main className="flex-grow flex items-center justify-center bg-black overflow-auto rounded-lg">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-full object-contain"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onDoubleClick={handleCanvasDoubleClick}
          />
        </main>
        
        {/* Properties Panel */}
        <aside className="w-64 flex-shrink-0 bg-surface/10 p-4 rounded-lg overflow-y-auto text-sm">
            <h3 className="font-bold text-text-header mb-4">Properties</h3>
            {activeTool === 'text' && selectedObjectId === null && <div className="text-text-muted">Klik dua kali pada gambar untuk menambah teks.</div>}

            {selectedObject && (
                <div className="space-y-4">
                     <h4 className="text-primary font-semibold">Edit Teks</h4>
                     <div><label className="block text-text-muted mb-1">Konten</label><textarea value={selectedObject.content} onChange={e => updateSelectedObject({ content: e.target.value })} className="w-full bg-background border border-border-main rounded-md p-2" rows={3}></textarea></div>
                     <div><label className="block text-text-muted mb-1">Font</label><select value={selectedObject.font} onChange={e => updateSelectedObject({ font: e.target.value })} className="w-full bg-background border border-border-main rounded-md p-2"><option value="">Pilih Font</option>{FONT_FAMILES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                     <div className="flex items-center gap-2">
                         <div className="flex-1"><label className="block text-text-muted mb-1">Ukuran</label><input type="number" value={selectedObject.size} onChange={e => updateSelectedObject({ size: parseInt(e.target.value, 10) || 12 })} className="w-full bg-background border border-border-main rounded-md p-2" /></div>
                         <div className="flex-1"><label className="block text-text-muted mb-1">Warna</label><input type="color" value={selectedObject.color} onChange={e => updateSelectedObject({ color: e.target.value })} className="w-full h-10 p-1 bg-background border border-border-main rounded-md" /></div>
                     </div>
                     <div className="pt-4 border-t border-border-main"><Button onClick={deleteSelectedObject} size="small" variant="secondary" className="w-full !border-red-500/50 !text-red-400 hover:!bg-red-500/20">Hapus Teks</Button></div>
                </div>
            )}
            
            {activeTool === 'filters' && (
                <div className="space-y-4">
                    <div><label className="flex justify-between text-text-muted"><span>Brightness</span><span>{filters.brightness}%</span></label><input type="range" min="0" max="200" value={filters.brightness} onChange={e => setFilters(f => ({...f, brightness: +e.target.value}))} className="w-full" /></div>
                    <div><label className="flex justify-between text-text-muted"><span>Contrast</span><span>{filters.contrast}%</span></label><input type="range" min="0" max="200" value={filters.contrast} onChange={e => setFilters(f => ({...f, contrast: +e.target.value}))} className="w-full" /></div>
                    <div><label className="flex justify-between text-text-muted"><span>Saturation</span><span>{filters.saturate}%</span></label><input type="range" min="0" max="200" value={filters.saturate} onChange={e => setFilters(f => ({...f, saturate: +e.target.value}))} className="w-full" /></div>
                    <div><label className="flex justify-between text-text-muted"><span>Grayscale</span><span>{filters.grayscale}%</span></label><input type="range" min="0" max="100" value={filters.grayscale} onChange={e => setFilters(f => ({...f, grayscale: +e.target.value}))} className="w-full" /></div>
                    <div className="pt-4 border-t border-border-main"><Button onClick={() => setFilters({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0 })} size="small" variant="secondary" className="w-full">Reset Filter</Button></div>
                </div>
            )}
        </aside>
      </div>
    </div>
  );
};

export default LightImageEditor;
