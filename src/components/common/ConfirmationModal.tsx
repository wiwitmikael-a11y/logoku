// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const ConfirmationModal: React.FC<{ show: boolean; onConfirm: () => void; onCancel: () => void; title: string; message: string; }> = ({ show, onConfirm, onCancel, title, message }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-sm w-full">
                <h2 className="text-xl font-bold text-text-header">{title}</h2>
                <p className="text-text-body mt-2">{message}</p>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onCancel} className="px-4 py-2 bg-background text-text-body rounded-lg">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
