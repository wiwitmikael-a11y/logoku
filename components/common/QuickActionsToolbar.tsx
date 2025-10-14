// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
import React from 'react';
// import type { CanvasState } from '../SotoshopTypes'; // Types are not available now

const QuickActionsToolbar: React.FC<any> = ({ onClose }) => {
    
    return (
        <header className="p-2 sm:p-3 border-b border-border-main flex justify-between items-center flex-shrink-0 bg-surface">
            <h2 className="text-lg sm:text-xl font-bold text-primary">Sotoshop Editor</h2>
            {/* Placeholder for future buttons */}
            <div className="flex items-center gap-2">
                 <button className="p-2 text-text-muted rounded-md hover:bg-background" disabled>Undo</button>
                 <button className="p-2 text-text-muted rounded-md hover:bg-background" disabled>Redo</button>
                 <button className="p-2 text-text-muted rounded-md hover:bg-background" disabled>Export</button>
            </div>
            <button onClick={onClose} className="bg-primary text-white font-bold py-1 px-4 rounded-lg hover:bg-primary-hover transition-colors">Tutup</button>
        </header>
    );
};

export default QuickActionsToolbar;
