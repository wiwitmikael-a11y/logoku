// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { Layer } from '../Sotoshop';
import Button from './Button';

interface LayersPanelProps {
    layers: Layer[];
    selectedLayerId: number | null;
    onSelectLayer: (id: number | null) => void;
    onUpdateLayer: (id: number, props: Partial<Layer>) => void;
    onDeleteLayer: (id: number) => void;
    onReorderLayers: (newLayers: Layer[]) => void;
    onAddLayer: (type: 'text' | 'shape', options?: any) => void;
    onUploadClick: () => void;
}

const LayerItem: React.FC<{
    layer: Layer;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (props: Partial<Layer>) => void;
    onDelete: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ layer, isSelected, onSelect, onUpdate, onDelete, ...dragProps }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState(layer.name);
    
    const handleRename = () => {
        onUpdate({ name });
        setIsRenaming(false);
    };

    const layerIcon = layer.type === 'text' ? 'T' : layer.type === 'image' ? '🖼️' : '■';

    return (
        <div 
            {...dragProps}
            draggable={!layer.isLocked}
            onClick={onSelect}
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-splash/20' : 'hover:bg-background'} ${layer.isLocked ? 'cursor-not-allowed' : ''}`}
        >
            <div className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-sm flex-shrink-0 ${isSelected ? 'bg-splash text-white' : 'bg-border-light text-text-header'}`}>{layerIcon}</div>
            <div className="flex-grow truncate text-sm" onDoubleClick={() => !layer.isLocked && setIsRenaming(true)}>
                {isRenaming ? (
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        onBlur={handleRename}
                        onKeyDown={e => e.key === 'Enter' && handleRename()}
                        autoFocus
                        className="w-full bg-surface border border-splash rounded-sm px-1"
                    />
                ) : (
                    <span className={!layer.isVisible ? 'line-through text-text-muted' : ''}>{layer.name}</span>
                )}
            </div>
            <div className="flex items-center flex-shrink-0">
                <button title="Toggle Lock" onClick={(e) => { e.stopPropagation(); onUpdate({ isLocked: !layer.isLocked }); }} className={`p-1 rounded ${layer.isLocked ? 'text-splash' : 'text-text-muted hover:text-white'}`}>{layer.isLocked ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 9a1 1 0 100-2 1 1 0 000 2z" /></svg>}</button>
                <button title="Toggle Visibility" onClick={(e) => { e.stopPropagation(); onUpdate({ isVisible: !layer.isVisible }); }} className={`p-1 rounded ${layer.isVisible ? 'text-text-header' : 'text-text-muted hover:text-white'}`}>{layer.isVisible ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.03 7-9.542 7S3.274 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 8.138 15.913 6 10 6a9.75 9.75 0 00-4.542 1.075L3.707 2.293zM10 12a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" /><path d="M10 17a9.953 9.953 0 01-4.542-1.075L4.11 17.293A1 1 0 012.7 15.88l1.414-1.414L6.44 12.13A9.953 9.953 0 0110 13c5.913 0 8.27 2.138 9.542 4-.853 1.31-2.012 2.41-3.44 3.125l-2.43-2.43a4.978 4.978 0 01-1.67.275z" /></svg>}</button>
            </div>
        </div>
    );
};

const LayersPanel: React.FC<LayersPanelProps> = ({ layers, selectedLayerId, onSelectLayer, onUpdateLayer, onDeleteLayer, onReorderLayers, onAddLayer, onUploadClick }) => {
    const dragItem = React.useRef<number | null>(null);
    const dragOverItem = React.useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newLayers = [...layers];
        const dragItemContent = newLayers.splice(dragItem.current, 1)[0];
        newLayers.splice(dragOverItem.current, 0, dragItemContent);
        onReorderLayers(newLayers);
        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    // Layers are stored bottom-to-top, but displayed top-to-bottom. We reverse for display.
    const displayLayers = [...layers].reverse();

    return (
        <aside className="w-64 flex-shrink-0 bg-surface p-2 border-r border-border-main flex flex-col">
            <div className="p-2 flex-shrink-0">
                <h3 className="font-bold text-lg text-text-header">Layers</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button onClick={() => onAddLayer('text')} size="small" variant="secondary">Add Text</Button>
                    <Button onClick={() => onAddLayer('shape', { shapeType: 'rectangle' })} size="small" variant="secondary">Add Shape</Button>
                    <Button onClick={onUploadClick} size="small" variant="secondary" className="col-span-2">Upload Image</Button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto space-y-1 p-1 mt-2 border-t border-border-main">
                {displayLayers.length === 0 ? (
                    <p className="text-xs text-center text-text-muted p-4">No layers yet. Add one to get started!</p>
                ) : (
                    displayLayers.map((layer, displayIndex) => {
                        const originalIndex = layers.length - 1 - displayIndex;
                        return (
                            <LayerItem
                                key={layer.id}
                                layer={layer}
                                isSelected={layer.id === selectedLayerId}
                                onSelect={() => onSelectLayer(layer.id)}
                                onUpdate={(props) => onUpdateLayer(layer.id, props)}
                                onDelete={() => onDeleteLayer(layer.id)}
                                onDragStart={(e) => handleDragStart(e, originalIndex)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDragEnd}
                                onDragEnter={(e) => handleDragEnter(e, originalIndex)}
                            />
                        )
                    })
                )}
            </div>
        </aside>
    );
};

export default LayersPanel;
