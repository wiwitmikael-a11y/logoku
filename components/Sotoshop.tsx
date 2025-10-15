// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';
import type { Profile } from '../types';
import { useUserActions } from '../contexts/UserActionsContext';
import * as geminiService from '../services/geminiService';
import LoadingMessage from './common/LoadingMessage';
import QuickActionsToolbar from './common/QuickActionsToolbar';
import LightImageEditor from './common/LightImageEditor';

// --- TYPE DEFINITIONS ---
type Tool = 'select' | 'hand' | 'text'  | 'elements' | 'upload' | 'ai_generate';
export type Layer = { id: number; type: 'text' | 'image' | 'shape'; name: string; x: number; y: number; width: number; height: number; rotation: number; isVisible: boolean; isLocked: boolean; opacity: number; content?: string; image?: HTMLImageElement; };
export type CanvasState = { layers: Layer[]; backgroundColor: string; width: number; height: number; };

interface SotoshopProps {
  show: boolean;
  onClose: () => void;
  profile: Profile | null;
  deductCredits: (amount: number) => Promise<boolean>;
  setShowOutOfCreditsModal: (show: boolean) => void;
  addXp: (amount: number) => void;
}

// --- MAIN COMPONENT ---
const Sotoshop: React.FC<SotoshopProps> = ({ show, onClose, profile, deductCredits, setShowOutOfCreditsModal, addXp }) => {
    const initialState: CanvasState = { layers: [], backgroundColor: '#18181b', width: 1080, height: 1080 };
    const [canvasState, setCanvasState] = useState<CanvasState>(initialState);
    const { layers, backgroundColor, width, height } = canvasState;
    
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [zoom, setZoom] = useState(0.5);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState<Tool>('select');

    const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    const addLayer = useCallback(<T extends Omit<Layer, 'id'>>(layerData: T) => {
        const newLayer = { ...layerData, id: Date.now() } as Layer;
        setCanvasState(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
        setSelectedLayerId(newLayer.id);
    }, []);
    
    // Effect to preload image from sessionStorage
    useEffect(() => {
        if (show) {
            const preloadImageSrc = sessionStorage.getItem('sotoshop_preload_image');
            if (preloadImageSrc) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = preloadImageSrc;
                img.onload = () => {
                    const newWidth = Math.min(img.width, width * 0.8);
                    const newHeight = newWidth * (img.height / img.width);
                    addLayer({
                        type: 'image',
                        image: img,
                        name: 'Preloaded Image',
                        x: (width - newWidth) / 2,
                        y: (height - newHeight) / 2,
                        width: newWidth,
                        height: newHeight,
                        rotation: 0,
                        isVisible: true,
                        isLocked: false,
                        opacity: 1,
                    });
                };
                sessionStorage.removeItem('sotoshop_preload_image');
            }
        }
    }, [show, addLayer, width, height]);

    // Canvas rendering effect
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        
        ctx.clearRect(0, 0, width, height);
        
        layers.forEach(layer => {
            if (!layer.isVisible) return;
            ctx.save();
            ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.globalAlpha = layer.opacity;

            if (layer.type === 'image' && layer.image) {
                ctx.drawImage(layer.image, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
            } else if (layer.type === 'text' && layer.content) {
                // Placeholder for text rendering
                ctx.fillStyle = 'white';
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(layer.content, 0, 0);
            }
            ctx.restore();
        });

    }, [layers, width, height]);


    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-background z-50 animate-content-fade-in">
            <div className="w-full h-full flex flex-col">
                <QuickActionsToolbar onClose={onClose} />
                <div className="flex-grow flex overflow-hidden">
                    <LightImageEditor activeTool={activeTool} setActiveTool={setActiveTool} />
                    <main className="flex-grow bg-background flex items-center justify-center relative" ref={viewportRef}>
                         <canvas ref={canvasRef} className="shadow-lg absolute" style={{ 
                            left: pan.x, 
                            top: pan.y, 
                            width: width * zoom, 
                            height: height * zoom, 
                            backgroundColor: backgroundColor 
                        }} width={width} height={height} />
                    </main>
                    {/* Placeholder for PropertiesPanel */}
                    <aside className="w-64 bg-surface border-l border-border-main flex-shrink-0 p-4">
                        <h3 className="font-bold text-text-header">Properties</h3>
                         <p className="text-sm text-text-muted mt-4">Panel properti akan muncul di sini.</p>
                    </aside>
                </div>
                <footer className="p-2 border-t border-border-main flex-shrink-0 text-xs text-text-muted flex justify-between items-center">
                    <div>
                        {selectedLayerId ? `Layer ID: ${selectedLayerId}` : 'No layer selected'}
                    </div>
                     <div>
                        Zoom: {(zoom * 100).toFixed(0)}%
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Sotoshop;