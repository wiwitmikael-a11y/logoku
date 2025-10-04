// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './common/Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

type Layer = TextLayer | ImageLayer;

interface BaseLayer {
  id: number;
  type: 'text' | 'image';
  x: number;
  y: number;
  rotation: number;
  scale: number;
}
interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  font: string;
  size: number;
  color: string;
}
interface ImageLayer extends BaseLayer {
  type: 'image';
  image: HTMLImageElement;
  originalWidth: number;
  originalHeight: number;
}

const FONT_FAMILIES = ['Plus Jakarta Sans', 'Bebas Neue', 'Caveat', 'Arial', 'Verdana', 'Times New Roman', 'Courier New'];

const Sotosop: React.FC<Props> = ({ show, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    layers.forEach(layer => {
      ctx.save();
      ctx.translate(layer.x, layer.y);
      // NOTE: Rotation and scaling would be applied here if implemented
      
      if (layer.type === 'image') {
        ctx.drawImage(layer.image, 0, 0, layer.originalWidth, layer.originalHeight);
      } else if (layer.type === 'text') {
        ctx.font = `${layer.size}px ${layer.font}`;
        ctx.fillStyle = layer.color;
        ctx.textBaseline = 'top';
        ctx.fillText(layer.content, 0, 0);

        if (layer.id === selectedLayerId) {
            const metrics = ctx.measureText(layer.content);
            const padding = 5;
            ctx.strokeStyle = 'rgb(var(--c-splash))';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(-padding, -padding, metrics.width + padding * 2, layer.size + padding * 2);
            ctx.setLineDash([]);
        }
      }
      ctx.restore();
    });
  }, [layers, selectedLayerId]);

  useEffect(() => {
    if (show) redrawCanvas();
  }, [show, layers, selectedLayerId, redrawCanvas]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if(canvas) {
            canvas.width = img.width;
            canvas.height = img.height;
        }
        const newImageLayer: ImageLayer = {
          id: Date.now(),
          type: 'image',
          image: img,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          originalWidth: img.width,
          originalHeight: img.height,
        };
        setLayers([newImageLayer]);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const addTextLayer = () => {
    const canvas = canvasRef.current;
    const newTextLayer: TextLayer = {
      id: Date.now(),
      type: 'text',
      content: 'Teks Baru',
      x: canvas ? canvas.width / 4 : 50,
      y: canvas ? canvas.height / 4 : 50,
      font: 'Plus Jakarta Sans',
      size: 48,
      color: '#FFFFFF',
      rotation: 0,
      scale: 1,
    };
    setLayers(prev => [...prev, newTextLayer]);
    setSelectedLayerId(newTextLayer.id);
  };
  
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
      };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    
    for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (layer.type === 'text') {
             const canvas = canvasRef.current;
             const ctx = canvas?.getContext('2d');
             if (!ctx) continue;
             ctx.font = `${layer.size}px ${layer.font}`;
             const metrics = ctx.measureText(layer.content);
             if (x >= layer.x && x <= layer.x + metrics.width && y >= layer.y && y <= layer.y + layer.size) {
                 setSelectedLayerId(layer.id);
                 setIsDragging(true);
                 setDragStart({ x: x - layer.x, y: y - layer.y });
                 return;
             }
        }
    }
    setSelectedLayerId(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || selectedLayerId === null) return;
    const { x, y } = getCanvasCoords(e);
    setLayers(prev => prev.map(layer => 
      layer.id === selectedLayerId ? { ...layer, x: x - dragStart.x, y: y - dragStart.y } : layer
    ));
  };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `sotosop-export-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // FIX: Added type guard `l.type === 'text'` to ensure `props` are only spread onto TextLayer objects, resolving the TypeScript error.
  const updateSelectedLayer = (props: Partial<TextLayer>) => {
    setLayers(prev => prev.map(l => {
        if (l.id === selectedLayerId && l.type === 'text') {
          // FIX: By creating an intermediate variable, we help TypeScript correctly infer
          // the type within the map callback, resolving the discriminated union issue.
          const updatedLayer: TextLayer = { ...l, ...props };
          return updatedLayer;
        }
        return l;
    }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex flex-col z-50 p-4" role="dialog" aria-modal="true">
      <header className="flex-shrink-0 flex justify-between items-center p-2 bg-surface/10 rounded-t-lg">
        <h2 className="text-xl font-bold text-splash" style={{fontFamily: 'var(--font-hand)'}}>Sotosop</h2>
        <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="splash" size="small">Unduh Gambar</Button>
            <Button onClick={onClose} variant="secondary" size="small">Tutup Editor</Button>
        </div>
      </header>
      
      <div className="flex-grow flex gap-4 mt-4 overflow-hidden">
        {/* Toolbar */}
        <aside className="w-60 flex-shrink-0 flex flex-col gap-2 bg-surface/10 p-2 rounded-lg">
           <Button onClick={() => fileInputRef.current?.click()} size="small" variant="secondary" className="w-full">Upload Gambar</Button>
           <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
           <Button onClick={addTextLayer} size="small" variant="secondary" className="w-full">Tambah Teks</Button>
        </aside>

        {/* Canvas Area */}
        <main className="flex-grow flex items-center justify-center bg-black overflow-auto rounded-lg">
          <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)} />
        </main>
        
        {/* Properties/Layers Panel */}
        <aside className="w-64 flex-shrink-0 bg-surface/10 p-4 rounded-lg overflow-y-auto text-sm space-y-4">
            <div>
                <h3 className="font-bold text-text-header mb-2">Layers</h3>
                <div className="space-y-1">
                    {layers.map(layer => (
                        <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} className={`p-2 rounded-md cursor-pointer transition-colors ${selectedLayerId === layer.id ? 'bg-splash/20' : 'bg-background/50 hover:bg-border-main'}`}>
                            {layer.type === 'text' ? `T: ${layer.content.substring(0, 15)}...` : '🖼️ Gambar Dasar'}
                        </div>
                    )).reverse()}
                </div>
            </div>
            {selectedLayer && selectedLayer.type === 'text' && (
                <div className="pt-4 border-t border-border-main space-y-4">
                     <h4 className="text-primary font-semibold">Edit Teks</h4>
                     <div><label className="block text-text-muted mb-1">Konten</label><textarea value={selectedLayer.content} onChange={e => updateSelectedLayer({ content: e.target.value })} className="w-full bg-background border border-border-main rounded-md p-2" rows={3}></textarea></div>
                     {/* FIX: Corrected typo from `FONT_FAMILES` to `FONT_FAMILIES`. */}
                     <div><label className="block text-text-muted mb-1">Font</label><select value={selectedLayer.font} onChange={e => updateSelectedLayer({ font: e.target.value })} className="w-full bg-background border border-border-main rounded-md p-2"><option value="">Pilih Font</option>{FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                     <div className="flex items-center gap-2">
                         <div className="flex-1"><label className="block text-text-muted mb-1">Ukuran</label><input type="number" value={selectedLayer.size} onChange={e => updateSelectedLayer({ size: parseInt(e.target.value, 10) || 12 })} className="w-full bg-background border border-border-main rounded-md p-2" /></div>
                         <div className="flex-1"><label className="block text-text-muted mb-1">Warna</label><input type="color" value={selectedLayer.color} onChange={e => updateSelectedLayer({ color: e.target.value })} className="w-full h-10 p-1 bg-background border border-border-main rounded-md" /></div>
                     </div>
                </div>
            )}
        </aside>
      </div>
    </div>
  );
};

export default Sotosop;
