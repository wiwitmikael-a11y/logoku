// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Layer, CanvasState, TextLayer, ShapeLayer } from '../Sotoshop';
import { 
    PropertyInput, 
    PropertyTextarea, 
    PropertySelect, 
    PropertyColorInput,
    PanelSection
} from '../Sotoshop';

interface PropertiesPanelProps {
    selectedLayer: Layer | null | undefined;
    canvasState: CanvasState;
    onUpdateLayer: (id: number, props: Partial<Layer>) => void;
    onUpdateCanvas: (props: Partial<CanvasState>) => void;
}

const FONT_FAMILES = ['Plus Jakarta Sans', 'Bebas Neue', 'Caveat', 'Arial', 'Verdana', 'Times New Roman'];

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedLayer, canvasState, onUpdateLayer, onUpdateCanvas }) => {

    const updateLayer = (props: Partial<Layer>) => {
        if (selectedLayer) {
            onUpdateLayer(selectedLayer.id, props);
        }
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-surface p-3 border-l border-border-main overflow-y-auto text-sm">
            <h3 className="font-bold text-lg text-text-header p-2">Properties</h3>
            {selectedLayer ? (
                <div className="space-y-3">
                    <PanelSection title="Transform" defaultOpen={true}>
                        <div className="grid grid-cols-2 gap-2"><PropertyInput label="X" type="number" value={Math.round(selectedLayer.x)} onChange={e => updateLayer({ x: +e.target.value })} /><PropertyInput label="Y" type="number" value={Math.round(selectedLayer.y)} onChange={e => updateLayer({ y: +e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-2"><PropertyInput label="Width" type="number" value={Math.round(selectedLayer.width)} onChange={e => updateLayer({ width: +e.target.value })} /><PropertyInput label="Height" type="number" value={Math.round(selectedLayer.height)} onChange={e => updateLayer({ height: +e.target.value })} /></div>
                        <PropertyInput label="Rotation" type="number" value={Math.round(selectedLayer.rotation)} onChange={e => updateLayer({ rotation: +e.target.value })} suffix="°" />
                    </PanelSection>
                     <PanelSection title="Appearance" defaultOpen={true}>
                        <PropertyInput label="Opacity" type="range" min="0" max="100" value={selectedLayer.opacity} onChange={e => updateLayer({ opacity: +e.target.value })} suffix="%" />
                    </PanelSection>
                    
                    {selectedLayer.type === 'text' && (
                        <PanelSection title="Text" defaultOpen={true}>
                            <PropertyTextarea label="Content" value={selectedLayer.content} onChange={e => updateLayer({ content: e.target.value })}/>
                            <PropertySelect label="Font" value={selectedLayer.font} onChange={e => updateLayer({ font: e.target.value })}>{FONT_FAMILES.map(f => <option key={f} value={f}>{f}</option>)}</PropertySelect>
                            <div className="grid grid-cols-2 gap-2"><PropertyInput label="Size" type="number" value={selectedLayer.size} onChange={e => updateLayer({ size: +e.target.value })} suffix="px" /><PropertyColorInput label="Color" value={selectedLayer.color} onChange={e => updateLayer({ color: e.target.value })} /></div>
                        </PanelSection>
                    )}

                    {selectedLayer.type === 'shape' && (
                        <PanelSection title="Shape" defaultOpen={true}>
                            <PropertyColorInput label="Fill" value={selectedLayer.fillColor} onChange={e => updateLayer({ fillColor: e.target.value })} />
                            <PropertyColorInput label="Stroke" value={selectedLayer.strokeColor} onChange={e => updateLayer({ strokeColor: e.target.value })} />
                            <PropertyInput label="Stroke Width" type="number" min="0" value={selectedLayer.strokeWidth} onChange={e => updateLayer({ strokeWidth: +e.target.value })} suffix="px" />
                        </PanelSection>
                    )}
                </div>
            ) : (
                <div className="p-2 space-y-4">
                    <h4 className="font-bold text-text-header text-xs uppercase tracking-wider">Canvas</h4>
                    <PropertyColorInput label="Background" value={canvasState.backgroundColor} onChange={e => onUpdateCanvas({ backgroundColor: e.target.value })}/>
                    <PropertyInput label="Width" type="number" value={canvasState.width} onChange={e => onUpdateCanvas({ width: +e.target.value })} suffix="px"/>
                    <PropertyInput label="Height" type="number" value={canvasState.height} onChange={e => onUpdateCanvas({ height: +e.target.value })} suffix="px"/>
                </div>
            )}
        </aside>
    );
};

export default PropertiesPanel;